import React from 'react';
import { useTheme, Theme } from '../context/ThemeContext';
import { Check, Palette } from 'lucide-react';
import { motion } from 'motion/react';

const themes: { id: Theme; name: string; color: string }[] = [
  { id: 'indigo', name: 'Indigo', color: '#4f46e5' },
  { id: 'orange', name: 'Orange', color: '#f97316' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6' },
];

export const ThemeSwitcher: React.FC = () => {
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Palette size={18} className="text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Choose Theme</h3>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="relative group flex flex-col items-center gap-1"
            title={t.name}
          >
            <div 
              className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                currentTheme === t.id ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: t.color }}
            >
              {currentTheme === t.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Check size={16} className="text-white" />
                </motion.div>
              )}
            </div>
            <span className={`text-[10px] font-bold ${currentTheme === t.id ? 'text-primary' : 'text-gray-400'}`}>
              {t.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
