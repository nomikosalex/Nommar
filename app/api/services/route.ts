import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/services — active services for the booking picker.
export async function GET() {
  const services = await prisma.service.findMany({
    where: { active: true },
    select: { slug: true, name: true, category: true, durationMin: true, description: true },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json({ services });
}
