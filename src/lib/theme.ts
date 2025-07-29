
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Semantic theme configuration
export const themeConfig = {
  colors: {
    // Semantic color mappings for better maintainability
    background: {
      primary: 'hsl(var(--background))',
      secondary: 'hsl(var(--secondary))',
      muted: 'hsl(var(--muted))',
      accent: 'hsl(var(--accent))',
    },
    text: {
      primary: 'hsl(var(--foreground))',
      secondary: 'hsl(var(--muted-foreground))',
      accent: 'hsl(var(--accent-foreground))',
    },
    border: {
      primary: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
    },
    interactive: {
      primary: 'hsl(var(--primary))',
      primaryForeground: 'hsl(var(--primary-foreground))',
      destructive: 'hsl(var(--destructive))',
      destructiveForeground: 'hsl(var(--destructive-foreground))',
    }
  },
  
  // Mobile-first breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
  
  // Touch-friendly spacing
  spacing: {
    touchTarget: '44px',
    cardPadding: {
      mobile: '1rem',
      desktop: '1.5rem',
    },
    sectionGap: {
      mobile: '1.5rem',
      desktop: '2rem',
    }
  }
};

// Theme utility functions
export const getThemeClass = (...classes: ClassValue[]) => {
  return twMerge(clsx(classes));
};

// Accessibility helpers
export const getFocusRing = () => 
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const getButtonFocus = () => 
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
