import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Popover, 
  PopoverBody, 
  PopoverContent, 
  PopoverDescription, 
  PopoverHeader, 
  PopoverTitle, 
  PopoverTrigger, 
  PopoverFooter 
} from '@/components/ui/popover';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { MobileNavigation } from '@/components/MobileNavigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Bookmark,
  StickyNote,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFocusRing } from '@/lib/theme';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const { toast } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Timer', href: '/timer', icon: Clock },
    { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { name: 'Notes', href: '/notes', icon: StickyNote },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const getAvatarUrl = () => {
    if (!profile?.avatar_url) return null;

    if (profile.avatar_url.startsWith('http')) {
      return profile.avatar_url;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url);

    return data.publicUrl;
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut();
      setShowLogoutDialog(false);
      navigate('/login');
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  const initials = profile?.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-background flex w-full">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-64 bg-card shadow-lg flex flex-col border-r relative">
            <div className="flex items-center px-6 py-4 border-b">
              <div className="text-xl font-bold text-foreground">FocusFlow</div>
            </div>

            <nav className="mt-6 flex-1 overflow-y-auto relative" role="navigation" aria-label="Main navigation">
              {/* Active indicator background - repositioned and improved
              {navigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                if (isActive) {
                  return (
                    <div 
                      key="active-indicator"
                      className="absolute left-0 w-1 bg-primary transition-all duration-500 ease-in-out rounded-r-full z-10"
                      style={{
                        height: '48px',
                        top: `${index * 56 + 4}px`,
                      }}
                    />
                  );
                }
                return null;
              })} */}

              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center px-6 py-3 mx-2 my-1 text-sm font-medium transition-all duration-300 ease-in-out',
                      'min-h-[48px] relative overflow-hidden group rounded-lg',
                      getFocusRing(),
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-sm hover:scale-[1.02]'
                    )}
                  >
                    {/* Enhanced hover background effect */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent transition-all duration-300 ease-in-out rounded-lg",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} />

                    <Icon className={cn(
                      "mr-3 h-5 w-5 transition-all duration-300 ease-in-out relative z-10",
                      isActive
                        ? "transform scale-110 text-primary"
                        : "group-hover:transform group-hover:scale-105 group-hover:text-primary"
                    )} />
                    <span className={cn(
                      "relative z-10 transition-all duration-300 ease-in-out",
                      isActive ? "font-semibold" : "group-hover:font-medium"
                    )}>
                      {item.name}
                    </span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop User Profile */}
            <div className="sticky bottom-0 w-full border-t bg-card mt-auto">
              {/* User Profile Section */}
              <div className="p-3">
                <Link to="/settings" className="block">
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group cursor-pointer">
                    <Avatar className="h-8 w-8 flex-shrink-0 transition-transform duration-200 ease-in-out group-hover:scale-110">
                      <AvatarImage
                        src={getAvatarUrl() || undefined}
                        alt={`${profile?.display_name || 'User'}'s profile picture`}
                      />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                        {profile?.display_name || user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Logout Button Section */}
              <div className="px-3 pb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutClick}
                  className={cn(
                    'w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 ease-in-out',
                    getFocusRing()
                  )}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="text-sm">Sign out</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          {isMobile && (
            <header className="bg-card border-b px-4 py-3 flex items-center justify-between shadow-sm">
              <MobileNavigation
                isOpen={mobileNavOpen}
                onToggle={() => setMobileNavOpen(!mobileNavOpen)}
              />
              <div className="text-lg font-bold text-foreground">FocusFlow</div>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getAvatarUrl() || undefined}
                          alt={`${profile?.display_name || 'User'}'s profile picture`}
                        />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-62" align="end">
                    <PopoverHeader>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={getAvatarUrl() || undefined}
                            alt={`${profile?.display_name || 'User'}'s profile picture`}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <PopoverTitle>{profile?.display_name || user?.email}</PopoverTitle>
                          <PopoverDescription className="text-xs">{user?.email}</PopoverDescription>
                        </div>
                      </div>
                    </PopoverHeader>
                    <PopoverBody className="space-y-1 px-2 py-1">
                      <Link to="/settings">
                        <Button variant="ghost" className="w-full justify-start" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                    </PopoverBody>
                    <PopoverFooter>
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent" 
                        size="sm"
                        onClick={handleLogoutClick}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </PopoverFooter>
                  </PopoverContent>
                </Popover>
              </div>
            </header>
          )}

          <main id="main-content" className="flex-1 overflow-auto">
            <div className="p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default Layout;
