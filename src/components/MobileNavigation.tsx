
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  BarChart3, 
  Settings,
  Menu,
  Bookmark,
  StickyNote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFocusRing } from '@/lib/theme';

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Timer', href: '/timer', icon: Clock },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'md:hidden',
            getFocusRing()
          )}
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="font-bricolage text-xl font-bold text-foreground">MethodOS</h2>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onToggle}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                        'min-h-[44px]', // Touch-friendly target
                        getFocusRing(),
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};
