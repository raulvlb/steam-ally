import { create } from 'zustand';
import { ThemeStore } from '@/types';

/**
 * Theme Store
 * Manages dark/light mode theme state
 */

const getInitialTheme = (): boolean => {
  const stored = localStorage.getItem('theme');
  if (stored) {
    return stored === 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  isDarkMode: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const newMode = !state.isDarkMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      
      // Update document class
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return { isDarkMode: newMode };
    }),
}));

// Initialize theme on app load
const isDark = getInitialTheme();
if (isDark) {
  document.documentElement.classList.add('dark');
}
