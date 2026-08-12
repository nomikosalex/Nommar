import Anthropic from '@anthropic-ai/sdk';

// AI-drafted replies to Google reviews. See REVIEWS-SETUP.md for how to get
// an ANTHROPIC_API_KEY. Follows the same graceful-degradation pattern as
// lib/email.ts — with no key set, logs to console and returns null instead
// of throwing, so the sync cron keeps working before the key is configured.

type ReviewInput = {
  authorName: string;
  rating: number; // 1-5
  reviewText: string;
};

const SYSTEM_PROMPT = `You are writing the owner's reply to a Google Business review for Nommar Beauty & Spa, a Japanese-inspired head spa and wellness spa in Kamari, Santorini, Greece. Nommar is a bilingual (Greek and English) business.

Write ONE reply, in the SAME language as the review — detect it from the review text. If it's in Greek, reply in Greek; if English, reply in English; if mixed or unclear, default to English.

Voice: write as if Margarita, the owner, is typing this herself — warm, natural, conversational. Use contractions where they'd sound natural. No corporate phrasing, no stiff formality, and never open with a generic line like "Thank you for your feedback" or "We appreciate your review." Reference something SPECIFIC the guest actually mentioned (a treatment, a staff member, a detail about their visit) — it should read like it was written for that one guest, not templated.

Never use an em dash (—) or a double hyphen (--) anywhere in the reply.

For 4-5 star reviews: express genuine gratitude and warmly invite them back.

For 1-3 star reviews: be empathetic and specific about the issue raised, never defensive or dismissive. Take ownership where appropriate. Invite them to continue the conversation offline (e.g. "please reach out to us directly") rather than trying to resolve everything in the public reply.

Keep it concise — 2 to 4 sentences. Sign off as "Nommar Beauty & Spa" (or the Greek equivalent) rather than an individual's name.

Return ONLY the reply text — no preamble, no explanation, no surrounding quotation marks.`;

/** Draft a reply for one review. Returns null if no API key is set, or if the API call fails. */
export async function generateReply(review: ReviewInput): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[generate-reply:dev] ANTHROPIC_API_KEY not set — skipping AI draft. See REVIEWS-SETUP.md.');
    return null;
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Guest: ${review.authorName}\nRating: ${review.rating}/5\nReview: "${review.reviewText}"`,
        },
      ],
    });

    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    return textBlock?.text.trim() || null;
  } catch (err) {
    console.error('[generate-reply] Anthropic API call failed:', err);
    return null;
  }
}
