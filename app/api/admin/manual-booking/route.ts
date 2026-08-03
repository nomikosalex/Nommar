import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { availableStartTimesForStaff, createManualBooking } from '@/lib/availability';

export const dynamic = 'force-dynamic';

// GET /api/admin/manual-booking?date=YYYY-MM-DD&staffId=#&service=slug
// Free :00/:30 start times for ONE therapist + ONE service on a day.
export async function GET(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get('date') || '';
  const staffId = Number(url.searchParams.get('staffId'));
  const service = url.searchParams.get('service') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !staffId || !service) {
    return NextResponse.json({ error: 'date, staffId and service are required' }, { status: 400 });
  }

  const result = await availableStartTimesForStaff(date, staffId, service);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ slots: result.slots });
}

const Body = z.object({
  staffId: z.number().int().positive(),
  service: z.string().trim().min(1),
  start: z.string().min(1), // ISO UTC instant
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    email: z.string().trim().email().optional().or(z.literal('')),
  }),
  locale: z.enum(['en', 'gr']).optional(),
  notes: z.string().trim().max(1000).optional(),
});

const STATUS: Record<string, number> = { invalid: 400, past: 409, unavailable: 409 };
const MESSAGES: Record<string, string> = {
  invalid: 'That therapist or service is not valid.',
  past: 'That time is in the past — please choose another.',
  unavailable: 'That therapist is no longer free at that time. Please choose another slot.',
};

// POST /api/admin/manual-booking — create a phone-in reservation for one guest,
// one service, with a specific therapist. Created already CONFIRMED.
export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const result = await createManualBooking({
    staffId: d.staffId,
    service: d.service,
    start: d.start,
    customer: { name: d.customer.name, phone: d.customer.phone || '', email: d.customer.email || undefined },
    locale: d.locale,
    notes: d.notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: MESSAGES[result.code] || 'Could not book.' }, { status: STATUS[result.code] ?? 400 });
  }
  return NextResponse.json({ ok: true, reservationId: result.reservationId }, { status: 201 });
}
