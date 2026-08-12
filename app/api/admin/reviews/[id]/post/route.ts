import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { postReply } from '@/lib/google-reviews';

export const dynamic = 'force-dynamic';

// POST /api/admin/reviews/[id]/post — { finalReply } posts the given text as
// the owner reply on Google, then records status: "posted" if finalReply
// matches the AI draft verbatim, "edited" if the admin changed it.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const reviewId = Number(id);
  if (!reviewId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const finalReply = String(body?.finalReply || '').trim();
  if (!finalReply) return NextResponse.json({ error: 'finalReply is required' }, { status: 400 });

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (['posted', 'auto_posted', 'edited'].includes(review.status)) {
    return NextResponse.json({ error: 'This review has already been replied to.' }, { status: 409 });
  }

  await postReply(review.googleReviewId, finalReply);

  const status = finalReply === (review.aiDraftReply || '').trim() ? 'posted' : 'edited';
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { finalReply, status, postedAt: new Date() },
  });

  return NextResponse.json({ ok: true, review: updated });
}
