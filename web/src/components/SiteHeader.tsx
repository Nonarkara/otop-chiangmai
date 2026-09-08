'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/products',  label: 'สินค้า' },
  { href: '/analytics', label: 'วิเคราะห์' },
  { href: '/submit',    label: 'ลงสินค้า' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="site-header-brand">
        <span className="site-header-otop">OTOP</span>
        <span className="site-header-dot" aria-hidden />
        <span className="site-header-province thai">เชียงใหม่</span>
      </Link>

      <nav className="site-header-nav" aria-label="เมนูหลัก">
        {NAV.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`site-header-nav-link thai${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
