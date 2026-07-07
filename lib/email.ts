import { Resend } from 'resend';

type Mail = { to: string; subject: string; html: string; text?: string };

/**
 * Send an email. Uses Resend when RESEND_API_KEY is set, otherwise logs to the
 * console so the booking flow works end-to-end in development without secrets.
 */
export async function sendEmail(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Nommar <info@nommar.gr>';

  if (!key) {
    console.log('\n[email:dev] (no RESEND_API_KEY — not actually sent)');
    console.log(`  from: ${from}\n  to:   ${mail.to}\n  subj: ${mail.subject}`);
    console.log(`  text: ${(mail.text || mail.html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300)}\n`);
    return { dev: true };
  }

  const resend = new Resend(key);
  return resend.emails.send({ from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });
}
