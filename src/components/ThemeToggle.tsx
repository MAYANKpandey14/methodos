
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, setTheme, systemTheme } = useTheme();

  const toggleTheme = () => {
    // Check actual current appearance to decide next state
    const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
    setTheme(isDark ? 'light' : 'dark');
  };

  const getIcon = () => {
    if (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) {
      return <Moon className="h-4 w-4" />;
    }
    return <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === 'system') return 'System theme';
    return theme === 'dark' ? 'Dark theme' : 'Light theme';
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        'h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200',
        '[&_svg]:transition-all [&_svg]:duration-300 [&_svg]:ease-out',
        'hover:[&_svg]:rotate-12 hover:[&_svg]:scale-110',
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
      title={getLabel()}
    >
      <span className="relative inline-flex">
        {getIcon()}
      </span>
    </Button>
  );
};

export default ThemeToggle;
