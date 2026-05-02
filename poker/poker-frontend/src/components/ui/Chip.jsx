import React from 'react';
import { motion } from 'framer-motion';

const CHIP_COLORS = { red: 'chip-red', blue: 'chip-blue', green: 'chip-green', gold: 'chip-cyan', black: 'chip-black' };

export default function Chip({ amount, color = 'cyan' }) {
  return (
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, y: -20 }}
      className={`chip ${CHIP_COLORS[color] || CHIP_COLORS.gold}`}
    >
      {amount}
    </motion.div>
  );
}
