import './load-env';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { bookableServices } from '../lib/data';
import { ROOMS } from '../lib/booking.config';

// Minutes-from-midnight helpers
const h = (hour: number) => hour * 60;

async function main() {
  // 1) Admin user
  const email = process.env.ADMIN_EMAIL ?? 'margarita@nommar.gr';
  const password = process.env.ADMIN_PASSWORD ?? 'changeme123';
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log(`✓ admin: ${email}`);

  // 2) Services (mirrored from the marketing data)
  for (const b of bookableServices()) {
    await prisma.service.upsert({
      where: { slug: b.slug },
      update: { name: b.name, category: b.category, durationMin: b.durationMin, description: b.desc },
      create: { slug: b.slug, name: b.name, category: b.category, durationMin: b.durationMin, description: b.desc },
    });
  }
  const services = await prisma.service.findMany();
  console.log(`✓ services: ${services.length}`);

  // 2b) Treatment rooms (with allowed categories)
  if ((await prisma.room.count()) === 0) {
    for (const r of ROOMS) {
      await prisma.room.create({ data: { name: r.name, categories: r.categories.join(','), capacity: r.capacity ?? 1 } });
    }
    console.log(`✓ rooms: ${ROOMS.length}`);
  } else {
    console.log('✓ rooms already seeded — skipping');
  }

  // 3) Staff + weekly working hours + which services they perform
  const existing = await prisma.staff.count();
  if (existing > 0) {
    console.log(`✓ staff already seeded (${existing}) — skipping`);
    return;
  }

  const byCategory = (cats: string[]) => services.filter((s) => cats.includes(s.category)).map((s) => ({ id: s.id }));

  const staffSeed = [
    {
      name: 'Margarita',
      categories: ['Head Spa', 'Massage', 'Body Treatments', 'Facial Treatments', 'Journey'],
      days: [0, 1, 2, 3, 4, 5, 6], // every day
      startMin: h(10),
      endMin: h(20),
    },
    {
      name: 'Eleni',
      categories: ['Head Spa', 'Facial Treatments', 'Journey'],
      days: [2, 3, 4, 5, 6], // Tue–Sat
      startMin: h(11),
      endMin: h(19),
    },
    {
      name: 'Sophia',
      categories: ['Massage', 'Body Treatments', 'Facial Treatments', 'Head Spa', 'Journey'],
      days: [1, 2, 3, 4, 5], // Mon–Fri
      startMin: h(10),
      endMin: h(18),
    },
  ];

  for (const s of staffSeed) {
    await prisma.staff.create({
      data: {
        name: s.name,
        services: { connect: byCategory(s.categories) },
        workingHours: {
          create: s.days.map((weekday) => ({ weekday, startMin: s.startMin, endMin: s.endMin })),
        },
      },
    });
  }
  console.log(`✓ staff: ${staffSeed.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
