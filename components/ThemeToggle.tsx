'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
      .matches;
    const nextTheme = stored ?? (prefersDark ? 'dark' : 'light');
    setIsDark(nextTheme === 'dark');
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next ? 'dark' : 'light');
      }
      return next;
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="border border-white/10 shadow-inner shadow-black/10"
      aria-label="Toggle color mode"
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </Button>
  );
}

