
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { prefersReducedMotion } from '@/lib/accessibility';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { profile, updateProfile, user } = useAuthStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [localTheme, setLocalTheme] = useState<Theme>('system');
  
  // Use profile theme if user is logged in, otherwise use local theme
  const theme = user ? (profile?.theme as Theme) || 'system' : localTheme;

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load local theme from localStorage on mount if no user
  useEffect(() => {
    if (!user) {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setLocalTheme(savedTheme);
      }
    }
  }, [user]);

  const setTheme = async (newTheme: Theme) => {
    if (user) {
      // User is logged in, save to profile
      try {
        await updateProfile({ theme: newTheme });
        applyTheme(newTheme);
      } catch (error) {
        console.error('Failed to update theme:', error);
        // Fallback to local storage if profile update fails
        localStorage.setItem('theme', newTheme);
        setLocalTheme(newTheme);
        applyTheme(newTheme);
      }
    } else {
      // User is not logged in, save to local storage
      localStorage.setItem('theme', newTheme);
      setLocalTheme(newTheme);
      applyTheme(newTheme);
    }
  };

  const applyTheme = (themeValue: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // Determine actual theme to apply
    let actualTheme: 'light' | 'dark';
    if (themeValue === 'system') {
      actualTheme = systemTheme;
    } else {
      actualTheme = themeValue;
    }

    root.classList.add(actualTheme);

    // Add smooth transition if motion is not reduced
    if (!prefersReducedMotion()) {
      root.style.transition = 'color 0.2s ease, background-color 0.2s ease';
      setTimeout(() => {
        root.style.transition = '';
      }, 200);
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        actualTheme === 'dark' ? '#0f172a' : '#ffffff'
      );
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme, systemTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
