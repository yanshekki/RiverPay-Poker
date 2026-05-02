import React from 'react';
import { motion } from 'framer-motion';

export default function NeonButton({ children, color = 'cyan', disabled, onClick, className = '', ...props }) {
  const colors = {
    cyan: 'from-rp-cyan to-rp-blue text-white neon-cyan',
    cyan: 'from-cyan-400 to-blue-600 text-black neon-cyan',
    emerald: 'from-rp-cyan to-rp-blue text-white neon-cyan',
    magenta: 'from-fuchsia-500 to-pink-600 text-white neon-magenta',
    rose: 'from-rose-500 to-red-600 text-white',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled}
      onClick={onClick}
      className={`bg-gradient-to-r ${colors[color]} px-6 py-3 rounded-xl font-bold transition-all touch-target ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
