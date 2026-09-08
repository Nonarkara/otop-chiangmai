import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OTOP เชียงใหม่ — สินค้าชุมชนล้านนา',
  description: 'ค้นหาและเลือกซื้อสินค้า OTOP คุณภาพจากเชียงใหม่ — ผ้าทอ เซรามิก กาแฟ อาหารพื้นเมือง และงานหัตถกรรมล้านนา',
  keywords: 'OTOP, เชียงใหม่, สินค้าชุมชน, ล้านนา, หัตถกรรม, เซรามิก, กาแฟ',
  authors: [{ name: 'OTOP Chiang Mai Platform' }],
  openGraph: {
    title: 'OTOP เชียงใหม่',
    description: 'สินค้าชุมชนล้านนาคัดสรร — พร้อมคะแนนคุณภาพและรีวิวจากผู้ซื้อจริง',
    type: 'website',
    locale: 'th_TH',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f0e8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="app-shell">
        {children}
      </body>
    </html>
  );
}
