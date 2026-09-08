'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',          label: 'หน้าแรก', icon: '⌂' },
  { href: '/products',  label: 'สินค้า',  icon: '⊞' },
  { href: '/analytics', label: 'วิเคราะห์', icon: '◈' },
  { href: '/submit',    label: 'ลงสินค้า', icon: '+' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="เมนูหลัก">
      {NAV.map(({ href, label, icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav-icon" aria-hidden>{icon}</span>
            <span className="bottom-nav-label thai">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
