'use client';

import * as React from 'react';
import { useAppStore } from '@/lib/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);
  
  React.useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark', 'medium-dark');
    
    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);
  
  return <>{children}</>;
}