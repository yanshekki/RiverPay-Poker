import React from 'react';

const SUITS = ['♠', '♥', '♦', '♣', '🃏'];

export default function SuitParticles({ count = 15 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    symbol: SUITS[i % SUITS.length],
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      fontSize: `${14 + Math.random() * 28}px`,
      opacity: 0.06 + Math.random() * 0.1,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${8 + Math.random() * 10}s`,
    },
    isRed: i % SUITS.length === 1 || i % SUITS.length === 2,
  }));

  return (
    <>
      {particles.map(p => (
        <div key={p.id} className="suit-particle" style={p.style}>
          <span className={p.isRed ? 'text-red-500' : 'text-white'}>{p.symbol}</span>
        </div>
      ))}
    </>
  );
}
