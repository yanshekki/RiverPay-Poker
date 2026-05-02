import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ErrorToast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-500/90 border border-rose-500 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg"
        >
          <AlertTriangle size={16} />
          <span className="text-white font-bold text-sm">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
