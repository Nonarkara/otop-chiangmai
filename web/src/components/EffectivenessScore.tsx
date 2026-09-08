'use client';

interface Props {
  score: number; // 0–100
  size?: 'sm' | 'lg';
}

export default function EffectivenessScore({ score, size = 'sm' }: Props) {
  const color = score >= 80
    ? 'var(--amber)'
    : score >= 60
    ? 'var(--dim)'
    : 'var(--fail)';

  return (
    <div className={`score-gauge score-gauge--${size}`} title={`คะแนนคุณภาพ ${score}/100`}>
      <div className="score-gauge-bar">
        <div className="score-gauge-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="score-gauge-value mono" style={{ color }}>{score}</span>
    </div>
  );
}
