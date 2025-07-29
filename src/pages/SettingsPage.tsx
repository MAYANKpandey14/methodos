
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePomodoroStore } from '../stores/pomodoroStore';
import { useTheme } from '../providers/ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from '@/components/AvatarUpload';
import { User, Bell, Clock, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserPreferences {
  theme: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  pomodoro_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  long_break_interval: number;
}

const SettingsPage = () => {
  const { user, profile, updateProfile } = useAuthStore();
  const { setDurations } = usePomodoroStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    display_name: profile?.display_name || '',
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: profile?.theme || 'light',
    notifications_enabled: profile?.notifications_enabled ?? true,
    sound_enabled: profile?.sound_enabled ?? true,
    pomodoro_duration: profile?.pomodoro_duration || 25,
    short_break_duration: profile?.short_break_duration || 5,
    long_break_duration: profile?.long_break_duration || 15,
    long_break_interval: profile?.long_break_interval || 4,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        display_name: profile.display_name || '',
      });
      setPreferences({
        theme: profile.theme || 'light',
        notifications_enabled: profile.notifications_enabled ?? true,
        sound_enabled: profile.sound_enabled ?? true,
        pomodoro_duration: profile.pomodoro_duration || 25,
        short_break_duration: profile.short_break_duration || 5,
        long_break_duration: profile.long_break_duration || 15,
        long_break_interval: profile.long_break_interval || 4,
      });
    }
  }, [profile]);

  const handleProfileUpdate = async () => {
    try {
      await updateProfile(profileData);
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      await updateProfile(preferences);
      
      // Update Pomodoro store with new durations
      setDurations(preferences.pomodoro_duration, preferences.short_break_duration);
      
      // Apply theme change
      await setTheme(preferences.theme as 'light' | 'dark');
      
      toast({
        title: 'Preferences Saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update preferences.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile</span>
          </CardTitle>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload size="lg" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={profileData.display_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Enter your display name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                placeholder="Enter your email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          <Button onClick={handleProfileUpdate}>
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications for task reminders</p>
            </div>
            <Switch
              id="notifications"
              checked={preferences.notifications_enabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, notifications_enabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound">Sound Notifications</Label>
              <p className="text-sm text-muted-foreground">Play sound when Pomodoro sessions end</p>
            </div>
            <Switch
              id="sound"
              checked={preferences.sound_enabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, sound_enabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Pomodoro Timer</span>
          </CardTitle>
          <CardDescription>
            Customize your Pomodoro timer durations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pomodoro">Pomodoro Duration (minutes)</Label>
              <Input
                id="pomodoro"
                type="number"
                min="1"
                max="120"
                value={preferences.pomodoro_duration}
                onChange={(e) => 
                  setPreferences(prev => ({ 
                    ...prev, 
                    pomodoro_duration: parseInt(e.target.value) || 25 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="shortBreak">Short Break (minutes)</Label>
              <Input
                id="shortBreak"
                type="number"
                min="1"
                max="60"
                value={preferences.short_break_duration}
                onChange={(e) => 
                  setPreferences(prev => ({ 
                    ...prev, 
                    short_break_duration: parseInt(e.target.value) || 5 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="longBreak">Long Break (minutes)</Label>
              <Input
                id="longBreak"
                type="number"
                min="1"
                max="120"
                value={preferences.long_break_duration}
                onChange={(e) => 
                  setPreferences(prev => ({ 
                    ...prev, 
                    long_break_duration: parseInt(e.target.value) || 15 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="longBreakInterval">Long Break Interval</Label>
              <Input
                id="longBreakInterval"
                type="number"
                min="2"
                max="10"
                value={preferences.long_break_interval}
                onChange={(e) => 
                  setPreferences(prev => ({ 
                    ...prev, 
                    long_break_interval: parseInt(e.target.value) || 4 
                  }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Take a long break after this many Pomodoros
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Appearance</span>
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <div className="flex space-x-4 mt-2">
              <Button
                variant={preferences.theme === 'light' ? 'default' : 'outline'}
                onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                className="flex-1"
              >
                Light
              </Button>
              <Button
                variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                className="flex-1"
              >
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save All Settings */}
      <div className="flex justify-end">
        <Button onClick={handlePreferencesUpdate} size="lg">
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
