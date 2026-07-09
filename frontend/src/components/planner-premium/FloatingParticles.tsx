import { useMemo } from 'react';

const PARTICLES = ['❤️', '💍', '🌸', '✨', '💕', '🌺'];

export default function FloatingParticles() {
  const items = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        emoji: PARTICLES[i % PARTICLES.length],
        left: `${5 + (i * 8) % 90}%`,
        top: `${10 + (i * 13) % 80}%`,
        delay: `${i * 0.4}s`,
        duration: `${4 + (i % 3)}s`,
        size: 0.8 + (i % 3) * 0.3,
      })),
    [],
  );

  const petals = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: `${15 + i * 14}%`,
        delay: `${i * 2.5}s`,
        duration: `${12 + i * 2}s`,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.id}
          className="wow-float-particle absolute opacity-40"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: `${p.size}rem`,
          }}
        >
          {p.emoji}
        </span>
      ))}
      {petals.map((p) => (
        <span
          key={`petal-${p.id}`}
          className="wow-petal absolute text-romantic-blush opacity-30"
          style={{
            left: p.left,
            top: '-20px',
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: '1rem',
          }}
        >
          🌸
        </span>
      ))}
    </div>
  );
}
