import { notFound } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';
import { el, enGB } from 'date-fns/locale';
import { prisma } from '@/lib/prisma';
import { TZ } from '@/lib/availability';
import ReservationManager, { type ReservationView } from '@/components/reservation/ReservationManager';

export const dynamic = 'force-dynamic';

// Public self-service page: guests open /r/<token> from their email to confirm
// their address or cancel. No auth — possession of the unguessable token is the key.
export default async function ReservationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const r = await prisma.reservation.findUnique({
    where: { token },
    include: {
      bookings: {
        include: { service: { select: { name: true, durationMin: true } }, staff: { select: { name: true } }, room: { select: { name: true } } },
        orderBy: [{ guestIndex: 'asc' }, { sequenceIndex: 'asc' }],
      },
    },
  });
  if (!r) notFound();

  const locale: 'en' | 'gr' = r.locale === 'gr' ? 'gr' : 'en';
  const first = [...r.bookings].sort((a, b) => +a.startsAt - +b.startsAt)[0];
  const day = first ? formatInTimeZone(first.startsAt, TZ, 'EEEE d MMMM yyyy', { locale: locale === 'gr' ? el : enGB }) : '';

  const guests: ReservationView['guests'] = [];
  for (let g = 1; g <= r.guestCount; g++) {
    const appts = r.bookings.filter((b) => b.guestIndex === g);
    if (appts.length === 0) continue;
    const label = g === 1 ? r.customerName : appts[0].guestName || `Guest ${g}`;
    guests.push({
      label,
      appts: appts.map((a) => ({
        time: formatInTimeZone(a.startsAt, TZ, 'HH:mm'),
        service: a.service.name,
        dur: a.service.durationMin,
        staff: a.staff.name,
        room: a.room.name,
      })),
    });
  }

  const view: ReservationView = {
    token: r.token,
    status: r.status as ReservationView['status'],
    locale,
    day,
    guests,
  };

  return <ReservationManager view={view} />;
}
