'use client';
import { useEffect, useState } from 'react';
import { loadLiveProducts } from '@/lib/catalog';

/**
 * Honest-envelope strip (§16.1 Law 3, §16.2 T0).
 * Sample cards stay labelled. A row written by /listings is a real local record.
 */
export default function DemoStrip() {
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    loadLiveProducts().then(rows => setLiveCount(rows.length));
  }, []);

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
        {liveCount ? 'Local' : 'Demo'}
      </span>
      <span
        className="thai"
        style={{
          fontSize: 'var(--text-micro)',
          lineHeight: 1.6,
        }}
      >
        {liveCount
          ? `การ์ดตัวอย่างยังเป็นข้อมูลสาธิต สินค้าที่ลงจากหน้าส่ง (${liveCount}) อยู่ในฐานข้อมูลเครื่องนี้`
          : 'ตัวอย่างระบบ — สินค้า รีวิว และคะแนนทั้งหมดเป็นข้อมูลสาธิต ยังไม่มีผู้ขายจริงบนแพลตฟอร์ม'}
      </span>
    </div>
  );
}
