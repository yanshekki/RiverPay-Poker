import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'zh-HK', label: '廣東話', flag: '🇭🇰' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher({ position = 'relative', size = 18 }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={position}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors touch-target flex items-center gap-1"
        aria-label="Switch language"
      >
        <Globe size={size} />
        <span className="text-xs font-bold hidden sm:inline">{i18n.language === 'zh-HK' ? '🇭🇰' : '🇬🇧'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[140px] backdrop-blur-xl"
          >
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors touch-target ${
                  i18n.language === lang.code
                    ? 'bg-rp-cyan/15 text-rp-cyan'
                    : 'text-neutral-300 hover:bg-white/5'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {i18n.language === lang.code && <span className="ml-auto text-rp-cyan text-xs">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
