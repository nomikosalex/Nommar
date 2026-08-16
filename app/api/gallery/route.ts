import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/gallery — active images, in display order, for the public /gallery page.
export async function GET() {
  const images = await prisma.galleryImage.findMany({
    where: { active: true },
    select: { id: true, imageUrl: true, captionEn: true, captionGr: true },
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ images });
}
