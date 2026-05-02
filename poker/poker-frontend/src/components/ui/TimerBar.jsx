import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TimerBar({ turnEndTime, isActive }) {
  const [width, setWidth] = useState(100);
  const [color, setColor] = useState('#22c55e');

  useEffect(() => {
    if (!turnEndTime || !isActive) { setWidth(0); return; }
    const total = turnEndTime - (Date.now() - 15000);
    if (total <= 0) { setWidth(0); return; }
    const update = () => {
      const remaining = turnEndTime - Date.now();
      const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
      setWidth(pct);
      setColor(pct > 50 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444');
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [turnEndTime, isActive]);

  if (!isActive || !turnEndTime) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[300px]">
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }}
          animate={{ width: `${width}%` }} transition={{ duration: 0.15 }} />
      </div>
    </motion.div>
  );
}
