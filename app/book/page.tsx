import type { Metadata } from 'next';
import { Suspense } from 'react';
import BookFlow from '@/components/booking/BookFlow';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: 'Reserve your treatment at Nommar Beauty & Spa, Kamari, Santorini — choose a service, time and therapist.',
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BookFlow />
    </Suspense>
  );
}
