import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext.tsx';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'expanded';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Tukar ke Mod Cerah (Light Mode)' : 'Tukar ke Mod Gelap (Dark Mode)'}
        className={`relative inline-flex h-8 w-15 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer ${
          isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-200 border border-slate-300/80'
        } ${className}`}
      >
        <span className="sr-only">Toggle theme</span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-sm transition-transform duration-300 ${
            isDark ? 'translate-x-7 text-indigo-400' : 'translate-x-0 text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </span>
      </button>
    );
  }

  if (variant === 'expanded') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span>{isDark ? 'Mod Gelap (Dark)' : 'Mod Cerah (Light)'}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  // Default 'icon' variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Tukar ke Mod Cerah (Light Mode)' : 'Tukar ke Mod Gelap (Dark Mode)'}
      className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
        isDark
          ? 'bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-750 hover:text-amber-200'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
      } ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 transform rotate-0 transition-transform duration-300 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 transform rotate-0 transition-transform duration-300 text-slate-600" />
        )}
      </div>
    </button>
  );
};
