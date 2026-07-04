// All editable content for the Nommar site lives here.

// ---- Translations (EN / GR) ----
const STRINGS = {
  navHome: ['Home', 'Αρχική'],
  navServices: ['Services', 'Υπηρεσίες'],
  navPackages: ['Packages', 'Πακέτα'],
  navAbout: ['About', 'Η Ιστορία μας'],
  navContact: ['Contact', 'Επικοινωνία'],
  bookNow: ['Book Now', 'Ραντεβού'],
  bookRitual: ['Book Your Ritual', 'Κλείστε το Ραντεβού σας'],
  // Action buttons (translated; surrounding prose stays English)
  reserve: ['Reserve', 'Κράτηση'],
  book: ['Book', 'Ραντεβού'],
  requestAppointment: ['Request Appointment', 'Αίτηση Ραντεβού'],
  exploreHeadSpa: ['Explore Head Spa', 'Δείτε το Head Spa'],
  ourStory: ['Our Story', 'Η Ιστορία μας'],
  view: ['View', 'Δείτε'],
  bookWhatsapp: ['Book on WhatsApp', 'Κράτηση στο WhatsApp'],
  bookAppointment: ['Book an Appointment', 'Κλείστε Ραντεβού'],
  // --- Booking flow ---
  bookTitle: ['Book Your Ritual', 'Κλείστε το Τελετουργικό σας'],
  stepGuests: ['Guests', 'Άτομα'],
  stepServices: ['Treatments', 'Θεραπείες'],
  stepWhen: ['Date & Time', 'Ημ/νία & Ώρα'],
  stepDetails: ['Details', 'Στοιχεία'],
  stepReview: ['Review', 'Επιβεβαίωση'],
  howManyGuests: ['How many guests?', 'Πόσα άτομα;'],
  onePerson: ['1 person', '1 άτομο'],
  twoPeople: ['2 people', '2 άτομα'],
  guest: ['Guest', 'Άτομο'],
  chooseTreatments: ['Choose treatments', 'Επιλέξτε θεραπείες'],
  journeys: ['Wellness Journeys', 'Wellness Journeys'],
  completeRitual: ['Complete your ritual', 'Ολοκληρώστε το τελετουργικό σας'],
  packageNotice: ['These treatments are available as the {name} — book the package to save.', 'Αυτές οι θεραπείες διατίθενται ως {name} — κλείστε το πακέτο για να εξοικονομήσετε.'],
  switchToPackage: ['Switch to package', 'Αλλαγή σε πακέτο'],
  yourBooking: ['Your booking', 'Η κράτησή σας'],
  total: ['Total', 'Σύνολο'],
  priceTbd: ['Price on request', 'Τιμή κατόπιν αιτήματος'],
  added: ['Added', 'Προστέθηκε'],
  add: ['Add', 'Προσθήκη'],
  remove: ['Remove', 'Αφαίρεση'],
  continueBtn: ['Continue', 'Συνέχεια'],
  backBtn: ['Back', 'Πίσω'],
  chooseDate: ['Choose a date', 'Επιλέξτε ημερομηνία'],
  availableTimes: ['Available times', 'Διαθέσιμες ώρες'],
  findingTimes: ['Finding open times…', 'Αναζήτηση διαθέσιμων ωρών…'],
  noTimes: ['No availability that day — please try another date.', 'Καμία διαθεσιμότητα εκείνη την ημέρα — δοκιμάστε άλλη ημερομηνία.'],
  tryAnotherDate: ['Choose another date', 'Επιλέξτε άλλη ημερομηνία'],
  primaryGuest: ['Primary guest', 'Κύριο άτομο'],
  secondGuest: ['Second guest', 'Δεύτερο άτομο'],
  fieldName: ['Name', 'Όνομα'],
  fieldFirstName: ['First name', 'Όνομα'],
  fieldEmail: ['Email', 'Email'],
  fieldPhone: ['Phone', 'Τηλέφωνο'],
  optional: ['optional', 'προαιρετικό'],
  notesLabel: ['Notes (optional)', 'Σημειώσεις (προαιρετικά)'],
  reviewTitle: ['Review your booking', 'Ελέγξτε την κράτησή σας'],
  arriveEarly: ['Please arrive 10 minutes before your appointment.', 'Παρακαλούμε προσέλθετε 10 λεπτά νωρίτερα από το ραντεβού σας.'],
  promoLabel: ['Promo code', 'Κωδικός προσφοράς'],
  promoPlaceholder: ['Enter code', 'Εισάγετε κωδικό'],
  promoApply: ['Apply', 'Εφαρμογή'],
  promoApplied: ['Promo applied — {pct}% off.', 'Η προσφορά εφαρμόστηκε — {pct}% έκπτωση.'],
  promoInvalid: ['That code is not valid.', 'Ο κωδικός δεν είναι έγκυρος.'],
  confirmBooking: ['Confirm booking', 'Επιβεβαίωση κράτησης'],
  requesting: ['Requesting…', 'Υποβολή…'],
  thankYou: ['Thank you', 'Ευχαριστούμε'],
  confirmationMsg: ['We have received your request and will confirm shortly.', 'Λάβαμε το αίτημά σας και θα το επιβεβαιώσουμε σύντομα.'],
  emailOnWay: ['A confirmation email is on its way.', 'Ένα email επιβεβαίωσης είναι καθ’ οδόν.'],
  backHome: ['Back to Home', 'Επιστροφή στην Αρχική'],
  minShort: ['min', 'λεπτά'],
  addAtLeastOne: ['Please add at least one treatment for each guest.', 'Προσθέστε τουλάχιστον μία θεραπεία για κάθε άτομο.'],
  completeFields: ['Please complete the required fields.', 'Συμπληρώστε τα υποχρεωτικά πεδία.'],
  reserveEyebrow: ['Reserve', 'Κράτηση'],
  tagline: [
    'Wellness begins the moment you allow yourself to slow down.',
    'Η ευεξία ξεκινά τη στιγμή που επιτρέπεις στον εαυτό σου να επιβραδύνει.',
  ],
};

export function translate(lang) {
  const i = lang === 'gr' ? 1 : 0;
  const out = {};
  for (const k in STRINGS) out[k] = STRINGS[k][i];
  return out;
}

// URL-safe slug from a service/package name (used for /book?service=… links + seed).
export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---- Pricing ----
export function priceLabel(priceMode = 'from') {
  if (priceMode === 'onRequest') return 'Price on request';
  if (priceMode === 'dash') return '—';
  return 'From €—';
}

// ---- Aromatherapy options ----
export const AROMAS = [
  { name: 'Lavender', note: 'Relaxation, better sleep and stress reduction.' },
  { name: 'Sweet Orange', note: 'Uplifting, fresh and summery.' },
  { name: 'Eucalyptus', note: 'Clarity and invigoration — ideal after travel.' },
  { name: 'Ylang-Ylang', note: 'Deep relaxation, sensual — a luxurious spa scent.' },
];

// ---- Service categories ----
export const CATEGORIES = [
  {
    index: 'I',
    name: 'Head Spa',
    intro: 'A Japanese-inspired ritual for the scalp, senses and spirit — our signature world.',
    badges: [
      { title: 'Shared Wellness Experiences', note: 'Can be enjoyed together with a partner or friend.' },
      {
        title: 'Pregnancy Friendly',
        note: 'Suitable during pregnancy if you are comfortable lying down — please inform your therapist beforehand.',
      },
    ],
    services: [
      {
        name: 'Nommar Signature Japanese Head Spa',
        duration: '90 min',
        durationMin: 90,
        badge: 'Signature',
        desc: 'Our complete wellness ritual — scalp care, therapeutic scalp massage, restorative facial treatments and deep relaxation, closing with a mineral-salt foot soak, exfoliation and massage.',
        list: ['Deep relaxation', 'Stress relief', 'Scalp purification', 'Improved wellbeing', 'Mental clarity', 'Enhanced self-care', 'Revitalized hair', 'Head-to-toe calm'],
        img: 'scalp ritual · warm oils',
      },
      {
        name: 'Nommar Essential Head Spa',
        duration: '60 min',
        durationMin: 60,
        desc: 'Scalp wellness and deep relaxation, layering Eastern technique with nourishing care.',
        list: ['Pressure-point techniques', 'Facial cleansing & mask', 'Double scalp cleanse', 'Scalp massage', 'Hair mask with steam', 'Hand massage', 'Gua Sha', 'Facial massage', 'Conditioning & rinse'],
        img: 'gua sha · scalp massage',
      },
      {
        name: 'Nommar Express Head Spa',
        duration: '30 min',
        durationMin: 30,
        desc: 'A condensed cleanse, scalp massage and nourishing hair care — ideal for first-timers, busy schedules and holiday visitors.',
        list: ['Condensed cleansing', 'Scalp massage', 'Nourishing hair care'],
        img: 'water flow · hair care',
      },
    ],
  },
  {
    index: 'II',
    name: 'Massage',
    intro: 'Hands-on therapies to release tension and return you to stillness.',
    badges: [],
    services: [
      { name: 'Nommar Relax Ritual', duration: '50 min', durationMin: 50, desc: 'Full-body relaxation to release tension and quiet the mind.', list: ['Full body', 'Soothing pressure', 'Calming oils'], img: 'linen · calm hands' },
      { name: 'Nommar Deep Release', duration: '50 min', durationMin: 50, desc: 'A deeper-pressure massage for stubborn, held tension.', list: ['Full body', 'Firm pressure', 'Targeted knots'], img: 'firm pressure · release' },
      { name: 'Nommar Back Relief', duration: '40 min', durationMin: 40, desc: 'Targeted relief for back, neck, shoulders and scalp.', list: ['Back & neck', 'Shoulders', 'Scalp'], img: 'neck & shoulders' },
      { name: 'Nommar Quick Escape', duration: '20 min', durationMin: 20, desc: 'Express relaxation — a brief, restoring pause.', list: ['Express', 'Neck & shoulders'], img: 'a quiet pause' },
      { name: 'Aromatherapy Massage', duration: '50 min', durationMin: 50, desc: 'A full-body massage with your chosen essential oil.', isAroma: true, img: 'essential oils · botanicals' },
    ],
  },
  {
    index: 'III',
    name: 'Body Treatments',
    intro: 'Renewing rituals for the skin, from exfoliation to nourishing masks.',
    badges: [],
    services: [
      { name: 'Nommar Body Ritual', duration: '30 min', durationMin: 30, desc: 'Full-body exfoliation, a customized body mask and a warm shower finish.', options: ['Hydration Ritual', 'Firming Ritual'], img: 'salt scrub · mineral' },
    ],
  },
  {
    index: 'IV',
    name: 'Facial Treatments',
    intro: 'Personalized facial care, tailored to your skin on the day.',
    badges: [],
    services: [
      { name: 'Nommar Personalized Facial Ritual', duration: '45 min', durationMin: 45, desc: 'Skin assessment, cleansing, exfoliation and targeted products with facial massage, closing with a neck & shoulder massage.', solutions: ['Hydration', 'Oil Balance', 'Sensitive Skin Care', 'Brightening & Radiance', 'Firming Care', 'Renewing Care'], img: 'facial massage · glow' },
    ],
  },
];

// ---- Curated journeys (packages) ----
export const PACKAGES = [
  { n: '01', name: 'Nommar Escape', duration: '80–90 min', durationMin: 95, desc: 'A gentle introduction to the Nommar world — release, then renew.', includes: ['Nommar Relax Ritual — 50′', 'Personalized Facial Ritual — 45′'], serviceSlugs: ['nommar-relax-ritual', 'nommar-personalized-facial-ritual'], img: 'linen · soft light' },
  { n: '02', name: 'Nommar Signature Journey', duration: '135 min', durationMin: 135, desc: 'Our Japanese head-spa philosophy paired with full-body calm.', includes: ['Essential Head Spa — 60′', 'Nommar Relax Ritual — 50′'], serviceSlugs: ['nommar-essential-head-spa', 'nommar-relax-ritual'], img: 'scalp ritual · warm oils' },
  { n: '03', name: 'Nommar Ultimate Ritual', duration: '180 min', durationMin: 185, badge: 'Most Complete', desc: 'The fullest expression of Nommar — head to toe, inside and out.', includes: ['Signature Head Spa — 90′', 'Nommar Relax Ritual — 50′', 'Personalized Facial — 45′'], serviceSlugs: ['nommar-signature-japanese-head-spa', 'nommar-relax-ritual', 'nommar-personalized-facial-ritual'], img: 'full ritual · serenity' },
  { n: '04', name: 'Nommar Glow Ritual', duration: '95 min', durationMin: 95, desc: 'Radiance for face and body in one luminous session.', includes: ['Personalized Facial — 45′', 'Nommar Body Ritual — 30′'], serviceSlugs: ['nommar-personalized-facial-ritual', 'nommar-body-ritual'], img: 'glow · radiance' },
];

// ---- Home page category previews ----
export const HOME_CATS = [
  { name: 'Head Spa', line: 'Japanese-inspired scalp & sensory ritual', img: 'scalp care · warm water' },
  { name: 'Massage', line: 'From deep release to a quick escape', img: 'calm hands · linen' },
  { name: 'Body', line: 'Exfoliation & nourishing body rituals', img: 'mineral salt · glow' },
  { name: 'Facial', line: 'Personalized care for luminous skin', img: 'facial · radiance' },
];

// The real, individually-bookable services (excludes packages). These are the
// rows seeded into the Service table — each maps to a room category.
export function bookableServices() {
  const out = [];
  CATEGORIES.forEach((c) =>
    c.services.forEach((s) =>
      out.push({ slug: slugify(s.name), name: s.name, category: c.name, durationMin: s.durationMin, desc: s.desc })
    )
  );
  return out;
}

// Package definitions resolved to their component service slugs (for scheduling
// + cross-sell). Packages are NOT in the Service table — they expand to these.
export function packageBySlug(slug) {
  return PACKAGES.find((p) => slugify(p.name) === slug) || null;
}

// Flat list of every bookable service + package (legacy helper; seed uses bookableServices).
export function allBookables() {
  const out = [];
  CATEGORIES.forEach((c) =>
    c.services.forEach((s) =>
      out.push({ slug: slugify(s.name), name: s.name, category: c.name, durationMin: s.durationMin, desc: s.desc })
    )
  );
  PACKAGES.forEach((p) =>
    out.push({ slug: slugify(p.name), name: p.name, category: 'Journey', durationMin: p.durationMin, desc: p.desc })
  );
  return out;
}

// ---- Site-wide contact details ----
export const CONTACT = {
  location: ['Kamari, Santorini', 'Cyclades, Greece'],
  phones: ['+30 698 013 3499', '+30 22860 33311'],
  email: 'hello@nommar.gr',
  instagram: { handle: '@nommar.beauty.spa', url: 'https://www.instagram.com/nommar.beauty.spa/' },
  hours: 'Daily · 10:00 — 20:00',
  mapEmbed: 'https://maps.google.com/maps?q=Kamari%2C%20Santorini%2C%20Greece&z=13&output=embed',
  whatsapp: '306980133499',
};

// ---- Guest testimonials (PLACEHOLDER copy — replace with real reviews) ----
export const TESTIMONIALS = [
  { quote: 'The most relaxed I have felt in years. The head spa was pure stillness — I floated out of there. A hidden gem in Kamari.', name: 'Eleni P.', detail: 'Signature Japanese Head Spa' },
  { quote: 'Margarita has the most healing hands. Every detail, from the warm towels to the scent, was thoughtful and calming.', name: 'Sophie L.', detail: 'Aromatherapy Massage' },
  { quote: 'A true sanctuary. We came as a couple and left completely renewed — already planning our next visit to Santorini around it.', name: 'Daniel & Mara', detail: 'Nommar Signature Journey' },
];

export const YEAR = 2026;
