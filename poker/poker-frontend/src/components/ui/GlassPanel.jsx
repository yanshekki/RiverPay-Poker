import React from 'react';
import { motion } from 'framer-motion';

export default function GlassPanel({ children, className = '', ...props }) {
  return (
    <motion.div
      {...props}
      className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] ${className}`}
    >
      {children}
    </motion.div>
  );
}
