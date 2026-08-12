'use client';
import { useEffect, useMemo, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAdminLocale } from '@/lib/useAdminLocale';

const COPY = {
  en: {
    heading: 'Reviews', subtitle: 'Google reviews with an AI-drafted reply — edit or post as-is.',
    loading: 'Loading…', empty: 'No reviews yet.',
    filterAll: 'All', filterPending: 'Pending', filterPosted: 'Posted',
    postAsWritten: 'Post as written', saveAndPost: 'Save edits & Post', posting: 'Posting…',
    noDraft: 'No AI draft — write a reply below.',
    statusPending: 'Pending', statusPosted: 'Posted', statusAutoPosted: 'Auto-posted', statusEdited: 'Edited', statusApproved: 'Approved',
    replyLabel: 'Reply',
  },
  gr: {
    heading: 'Κριτικές', subtitle: 'Κριτικές Google με προτεινόμενη απάντηση AI — επεξεργαστείτε ή στείλτε ως έχει.',
    loading: 'Φόρτωση…', empty: 'Δεν υπάρχουν ακόμα κριτικές.',
    filterAll: 'Όλες', filterPending: 'Εκκρεμείς', filterPosted: 'Απαντημένες',
    postAsWritten: 'Αποστολή ως έχει', saveAndPost: 'Αποθήκευση & Αποστολή', posting: 'Αποστολή…',
    noDraft: 'Δεν υπάρχει προτεινόμενη απάντηση — γράψτε μία παρακάτω.',
    statusPending: 'Εκκρεμεί', statusPosted: 'Απαντήθηκε', statusAutoPosted: 'Αυτόματη απάντηση', statusEdited: 'Επεξεργασμένη', statusApproved: 'Εγκρίθηκε',
    replyLabel: 'Απάντηση',
  },
};

const card = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;';
const inp = "font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:9px 11px;outline:none;width:100%;";
const addBtn = "font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:10px 18px;cursor:pointer;border-radius:1px;";
const ghost = "font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:10px 18px;cursor:pointer;border-radius:1px;";

const STATUS_STYLE = {
  pending: 'background:#F4E4BC;color:#8A5A00;',
  posted: 'background:#CFE6CF;color:#2E5C33;',
  auto_posted: 'background:#CFE6CF;color:#2E5C33;',
  edited: 'background:#D9E4F0;color:#2B4C6B;',
  approved: 'background:#E6CF95;color:#5C4300;',
};

export default function Reviews() {
  const locale = useAdminLocale();
  const t = COPY[locale];
  const [reviews, setReviews] = useState(null);
  const [filter, setFilter] = useState('all');
  const [drafts, setDrafts] = useState({}); // reviewId -> editable text
  const [posting, setPosting] = useState(null); // reviewId currently posting
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/admin/reviews')
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const r of d.reviews || []) {
            if (next[r.id] === undefined) next[r.id] = r.aiDraftReply || '';
          }
          return next;
        });
      });
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!reviews) return [];
    if (filter === 'pending') return reviews.filter((r) => r.status === 'pending');
    if (filter === 'posted') return reviews.filter((r) => r.status !== 'pending');
    return reviews;
  }, [reviews, filter]);

  const post = async (review, text) => {
    setError('');
    setPosting(review.id);
    const r = await fetch(`/api/admin/reviews/${review.id}/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalReply: text }),
    });
    const d = await r.json().catch(() => ({}));
    setPosting(null);
    if (!r.ok) { setError(d.error || 'Could not post.'); return; }
    load();
  };

  const statusLabel = (status) => t['status' + status.charAt(0).toUpperCase() + status.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())] || status;

  const filterBtn = (key, label) => (
    <FX
      as="button"
      onClick={() => setFilter(key)}
      style={"font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;padding:9px 16px;border-radius:1px;border:1px solid rgba(194,165,107,0.45);" + (filter === key ? 'background:linear-gradient(135deg,#E6CF95,#C2A56B);color:#3D2F25;' : 'background:none;color:#8A7965;')}
      hover={filter === key ? '' : 'border-color:#C2A56B;color:#3D2F25;'}
    >
      {label}
    </FX>
  );

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:900px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px);')}>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);margin:0 0 6px;")}>{t.heading}</h1>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 20px;")}>{t.subtitle}</p>

        <div style={css('display:flex;gap:8px;margin-bottom:22px;')}>
          {filterBtn('all', t.filterAll)}
          {filterBtn('pending', t.filterPending)}
          {filterBtn('posted', t.filterPosted)}
        </div>

        {error && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13px;margin-bottom:16px;")}>{error}</div>}

        {reviews === null ? (
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>{t.loading}</p>
        ) : filtered.length === 0 ? (
          <p style={css("font-family:var(--font-jost),sans-serif;font-size:14px;color:#8A7965;")}>{t.empty}</p>
        ) : (
          <div style={css('display:flex;flex-direction:column;gap:18px;')}>
            {filtered.map((review) => {
              const draftText = drafts[review.id] ?? '';
              const unedited = review.aiDraftReply != null && draftText === review.aiDraftReply;
              const canAct = review.status === 'pending';
              return (
                <div key={review.id} style={css(card + 'padding:20px 22px;')}>
                  <div style={css('display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;')}>
                    <div style={css('display:flex;align-items:center;gap:10px;')}>
                      <span style={css("color:#C2A56B;font-size:15px;letter-spacing:1px;")}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span style={css("font-family:var(--font-cinzel),serif;font-size:15px;color:#3D2F25;")}>{review.authorName}</span>
                    </div>
                    <span style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;padding:5px 10px;border-radius:12px;" + (STATUS_STYLE[review.status] || ''))}>{statusLabel(review.status)}</span>
                  </div>
                  <p style={css("font-family:var(--font-jost),sans-serif;font-size:11px;color:#A8967C;margin:0 0 10px;")}>{new Date(review.reviewDate).toLocaleDateString(locale === 'gr' ? 'el-GR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;line-height:1.7;color:#6E5E50;margin:0 0 16px;")}>{review.reviewText}</p>

                  <label style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#A8967C;margin-bottom:6px;display:block;")}>{t.replyLabel}</label>
                  <textarea
                    value={draftText}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                    placeholder={!review.aiDraftReply ? t.noDraft : ''}
                    disabled={!canAct}
                    rows={3}
                    style={css(inp + 'resize:vertical;font-family:var(--font-jost),sans-serif;margin-bottom:12px;' + (canAct ? '' : 'opacity:0.7;'))}
                  />

                  {canAct && (
                    <div style={css('display:flex;gap:10px;flex-wrap:wrap;')}>
                      <FX
                        as="button"
                        onClick={() => post(review, review.aiDraftReply)}
                        disabled={!review.aiDraftReply || posting === review.id}
                        style={addBtn + (!review.aiDraftReply || posting === review.id ? 'opacity:0.5;' : '')}
                        hover="transform:translateY(-1px);"
                      >
                        {posting === review.id ? t.posting : t.postAsWritten}
                      </FX>
                      <FX
                        as="button"
                        onClick={() => post(review, draftText)}
                        disabled={!draftText.trim() || posting === review.id || unedited}
                        style={ghost + (!draftText.trim() || posting === review.id || unedited ? 'opacity:0.5;' : '')}
                        hover="border-color:#C2A56B;color:#3D2F25;"
                      >
                        {posting === review.id ? t.posting : t.saveAndPost}
                      </FX>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
