/**
 * Honest-envelope strip (§16.1 Law 3, §16.2 T0).
 *
 * Every product, review, rating and score on this site is seed data. Until the
 * LINE/Telegram ingestion bot is live and writing to Supabase, that has to be
 * stated on the page itself — a fake number shown as live is worse than an error.
 *
 * Dark amber on pale amber, per §11.10's warning-strip convention. Not sticky:
 * the page loads at scroll-0 so every arrival sees it, and it does not
 * permanently eat phone viewport height (§11.8).
 */
export default function DemoStrip() {
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px 10px',
        padding: `calc(var(--sat) + 8px) var(--sp-md) 8px`,
        background: 'var(--amber-dim)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
        color: '#7a3a00',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-micro)',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Demo
      </span>
      <span
        className="thai"
        style={{
          fontSize: 'var(--text-micro)',
          lineHeight: 1.6,
        }}
      >
        ตัวอย่างระบบ — สินค้า รีวิว และคะแนนทั้งหมดเป็นข้อมูลสาธิต ยังไม่มีผู้ขายจริงบนแพลตฟอร์ม
      </span>
    </div>
  );
}
