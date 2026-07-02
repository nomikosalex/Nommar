import { NextResponse } from 'next/server';
import { z } from 'zod';
import { availableStartTimesForRequest } from '@/lib/availability';

export const dynamic = 'force-dynamic';

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.array(z.object({ services: z.array(z.string().min(1)).min(1) })).min(1).max(2),
});

// POST /api/availability — { date, guests:[{services:[slug…]}] } -> feasible :00/:30 starts
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const result = await availableStartTimesForRequest(parsed.data.date, parsed.data.guests);
  if (result.error) return NextResponse.json({ error: result.error, slots: [] }, { status: 400 });
  return NextResponse.json({ slots: result.slots });
}
