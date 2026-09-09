'use client';
import SiteHeader from '@/components/SiteHeader';
import BottomNav from '@/components/BottomNav';

const STEPS = [
  {
    n: '01',
    title: 'เข้าร่วมช่องทางของเรา',
    desc: 'เมื่อเปิดให้บริการ ผู้ขายจะเพิ่ม OTOP เชียงใหม่บอท ใน LINE หรือ Telegram',
  },
  {
    n: '02',
    title: 'ถ่ายรูปสินค้า',
    desc: 'รูปภาพชัดเจน พื้นหลังเรียบ แสงสว่างเพียงพอ ระบบ AI จะวิเคราะห์สินค้าจากรูปโดยอัตโนมัติ',
  },
  {
    n: '03',
    title: 'ส่งรูปพร้อมข้อมูล',
    desc: 'ส่งรูปสินค้าพร้อม caption หรือข้อความ:\n\nสินค้า: ชื่อสินค้า\nราคา: xxx–xxx บาท\nอำเภอ: ชื่ออำเภอ\nรายละเอียด: ...',
  },
  {
    n: '04',
    title: 'AI วิเคราะห์อัตโนมัติ',
    desc: 'ระบบ Gemini Vision จะวิเคราะห์รูปภาพและข้อมูล สร้างคำอธิบายภาษาไทยและอังกฤษ และให้คะแนนคุณภาพสินค้าโดยอัตโนมัติ',
  },
  {
    n: '05',
    title: 'สินค้าขึ้นแพลตฟอร์มภายใน 2 นาที',
    desc: 'เมื่อวิเคราะห์เสร็จ บอทจะส่งข้อความยืนยัน และสินค้าของคุณจะปรากฏบน OTOP เชียงใหม่ให้ผู้ซื้อทั่วประเทศเห็น',
  },
];

// Neither bot is registered yet. Advertising a handle that does not exist sends a
// real seller to a dead end, so the channels are shown as not-yet-open instead.
const CHANNELS = [
  { platform: 'line',     name: 'OTOP เชียงใหม่ (LINE)' },
  { platform: 'telegram', name: 'OTOP Chiang Mai (Telegram)' },
];

const TIPS = [
  'รูปภาพพื้นหลังขาวหรือเรียบ ได้คะแนนสูงกว่า',
  'ระบุแหล่งผลิต (อำเภอ/ตำบล) เพิ่มน้ำหนักสินค้าชุมชน',
  'บรรยายวัตถุดิบและกรรมวิธีผลิต เพิ่มคะแนน AI',
  'ราคาชัดเจน ช่วยให้ผู้ซื้อตัดสินใจได้เร็วขึ้น',
  'สินค้า OTOP 5 ดาวจะถูกแนะนำในหน้าแรก',
];

export default function SubmitPage() {
  return (
    <>
      <SiteHeader />

      <main className="main-content">
        <div className="submit-page">
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)',
              fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--dim)', marginBottom: '8px',
            }}>
              FOR SELLERS · สำหรับผู้ขาย
            </p>
            <h1 style={{ fontFamily: 'var(--font-thai)', fontSize: 'var(--text-display)', fontWeight: 600, lineHeight: 1.2 }}>
              ลงสินค้า<br />ผ่าน LINE / Telegram
            </h1>
            <p className="thai" style={{ marginTop: '12px', fontSize: 'var(--text-body)', color: 'var(--dim)', lineHeight: 1.7 }}>
              ไม่ต้องสมัครสมาชิก ไม่ต้องเปิดเว็บ แค่ส่งรูปสินค้ามาในแชท ระบบ AI จะจัดการให้ทุกอย่าง
            </p>
            <p className="thai" style={{ marginTop: '10px', fontSize: 'var(--text-micro)', color: '#7a3a00', lineHeight: 1.7 }}>
              ขั้นตอนด้านล่างคือรูปแบบการใช้งานที่กำลังพัฒนา ยังไม่เปิดรับสินค้าจริง
            </p>
          </div>

          {/* Channel links */}
          <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CHANNELS.map(ch => (
              <div key={ch.platform} className="submit-channel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className={`submit-channel-platform ${ch.platform}`}>{ch.platform.toUpperCase()}</span>
                  <span className="submit-channel-name thai">{ch.name}</span>
                  <span className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>ยังไม่เปิดให้บริการ</span>
                </div>
                <span className="submit-channel-action" style={{ color: 'var(--dim)' }}>เร็ว ๆ นี้</span>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {STEPS.map(step => (
              <div key={step.n} className="submit-step">
                <div className="submit-step-number">{step.n}</div>
                <div className="submit-step-body">
                  <div className="submit-step-title thai">{step.title}</div>
                  <div className="submit-step-desc thai" style={{ whiteSpace: 'pre-line' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{ marginTop: '40px', padding: '20px', border: '1px solid var(--line)', borderLeft: '3px solid var(--amber)', background: 'var(--surface)' }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)',
              fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--dim)', marginBottom: '12px',
            }}>
              เคล็ดลับเพิ่มคะแนน AI
            </p>
            {TIPS.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <span className="mono" style={{ fontSize: 'var(--text-micro)', color: 'var(--amber)', flex: '0 0 16px' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="thai" style={{ fontSize: 'var(--text-body)', color: 'var(--fg)', lineHeight: 1.6 }}>
                  {tip}
                </span>
              </div>
            ))}
          </div>

          {/* OTOP eligibility note */}
          <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--line)' }}>
            <p className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)', lineHeight: 1.7 }}>
              สินค้าที่ลงทะเบียนต้องเป็นสินค้า OTOP ของชุมชนในจังหวัดเชียงใหม่ และต้องผ่านการตรวจสอบเบื้องต้นจากทีมงานก่อนแสดงบนแพลตฟอร์ม
            </p>
          </div>

          <div style={{ height: '24px' }} />
        </div>
      </main>

      <BottomNav />
    </>
  );
}
