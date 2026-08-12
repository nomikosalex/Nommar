import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/reviews — all reviews, pending first, newest-first within
// each group.
export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reviews = await prisma.review.findMany({ orderBy: { reviewDate: 'desc' } });
  // Array.sort is stable, so this only reorders across the pending/not-pending
  // boundary — the reviewDate-desc order from the query is preserved within
  // each group.
  reviews.sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));

  return NextResponse.json({ reviews });
}
