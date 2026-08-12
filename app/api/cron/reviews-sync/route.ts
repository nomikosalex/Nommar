import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchReviews, postReply } from '@/lib/google-reviews';
import { generateReply } from '@/lib/generate-reply';
import { isAutoPostEligible } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

// GET /api/cron/reviews-sync — run every 1-2h by Vercel Cron (see vercel.json).
// Same auth pattern as /api/cron/reminders.
//
// Two jobs in one run, kept together deliberately rather than as separate
// cron entries: (1) pull new Google reviews, upsert by googleReviewId
// (skipping ones already stored), and AI-draft a reply for each newly-seen
// review; (2) sweep pending reviews for the optional 24h auto-post rule.
// Both are cheap, run on the same table, and don't need independent
// schedules — one job is simpler than two near-duplicate ones.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- 1. Sync new reviews + draft replies ---
  const fetched = await fetchReviews();
  let synced = 0;
  let drafted = 0;

  for (const r of fetched) {
    const existing = await prisma.review.findUnique({ where: { googleReviewId: r.googleReviewId } });
    if (existing) continue; // already stored — leave its status/reply alone

    const created = await prisma.review.create({
      data: {
        googleReviewId: r.googleReviewId,
        authorName: r.authorName,
        rating: r.rating,
        reviewText: r.reviewText,
        reviewDate: new Date(r.reviewDate),
      },
    });
    synced++;

    const draft = await generateReply({ authorName: r.authorName, rating: r.rating, reviewText: r.reviewText });
    if (draft) {
      await prisma.review.update({ where: { id: created.id }, data: { aiDraftReply: draft } });
      drafted++;
    }
  }

  // --- 2. Auto-post sweep (optional, default OFF) ---
  // IMPORTANT: ratings of 3 or below never auto-post — enforced inside
  // isAutoPostEligible, not just by this query, so it holds even if this
  // query's filters are ever loosened later.
  let autoPosted = 0;
  if (process.env.REVIEWS_AUTO_POST_ENABLED === 'true') {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const candidates = await prisma.review.findMany({
      where: { status: 'pending', aiDraftReply: { not: null }, createdAt: { lte: dayAgo } },
    });

    for (const review of candidates) {
      if (!isAutoPostEligible(review)) continue;
      try {
        await postReply(review.googleReviewId, review.aiDraftReply!);
        await prisma.review.update({
          where: { id: review.id },
          data: { status: 'auto_posted', finalReply: review.aiDraftReply, postedAt: new Date() },
        });
        autoPosted++;
      } catch (err) {
        console.error(`[reviews-sync] auto-post failed for review ${review.id}:`, err);
        // leave status=pending so the next sweep (or a human) retries/handles it
      }
    }
  }

  return NextResponse.json({ ok: true, fetched: fetched.length, synced, drafted, autoPosted });
}
