'use client';
import type { Category } from '@/lib/types';

interface Props {
  category: Category;
  active: boolean;
  onClick: () => void;
}

export default function CategoryPill({ category, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`category-pill${active ? ' active' : ''}`}
      aria-pressed={active}
    >
      <span className="category-pill-icon">{category.icon_motif}</span>
      <span className="category-pill-label thai">{category.name_th}</span>
    </button>
  );
}
