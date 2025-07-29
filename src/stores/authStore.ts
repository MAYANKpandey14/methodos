import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Define the shape of a user profile
interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: string | null;
  pomodoro_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  long_break_interval: number;
  notifications_enabled: boolean;
  sound_enabled: boolean;
}

// Define the state and actions for our auth store
interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  continueWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  loadProfile: () => Promise<void>;
  _loadProfile: () => Promise<void>;
  _handleSignIn: () => Promise<void>;
}

/**
 * A helper function to determine if a user session is fully authenticated.
 * For non-OAuth providers, this requires the email to be confirmed.
 * @param session - The Supabase session object.
 * @returns boolean
 */
const isUserAuthenticated = (session: Session | null): boolean => {
  if (!session?.user) {
    return false;
  }
  
  const isGoogleProvider = session.user.app_metadata?.provider === 'google';
  const isEmailConfirmed = !!session.user.email_confirmed_at;

  // Google users are considered authenticated immediately.
  // Others must confirm their email.
  return isGoogleProvider || isEmailConfirmed;
};

/**
 * A simple input sanitizer.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
const sanitizeInput = (input: string): string => {
    // A basic sanitizer. For production, consider a more robust library like DOMPurify.
    return input.replace(/[<>\"'&]/g, '').trim();
};

/**
 * Validates an email format.
 * @param email The email string to validate.
 * @returns boolean
 */
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true, // Start with loading true until the initial session is checked
  isAuthenticated: false,

  /**
   * Initializes the auth store by checking for an existing session and setting up the auth state listener.
   * This should be called once when the application mounts.
   */
  initialize: () => {
    let isInitialized = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuthenticated = isUserAuthenticated(session);
      
      set({ 
        user: session?.user ?? null, 
        session, 
        isAuthenticated,
        loading: false 
      });

      // Only handle sign-in logic if this is a new sign-in event, not initialization
      if (event === 'SIGNED_IN' && isAuthenticated && isInitialized) {
        console.log('🔑 User signed in successfully');
        // Defer profile handling to avoid potential deadlocks
        setTimeout(() => {
          get()._handleSignIn();
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        set({ profile: null });
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuthenticated = isUserAuthenticated(session);
      set({ 
        user: session?.user ?? null, 
        session, 
        isAuthenticated,
        loading: false 
      });
      
      // If already authenticated on init, load profile without triggering sign-in flow
      if (isAuthenticated) {
        get()._loadProfile();
      }
      
      isInitialized = true;
    });

    // Store the subscription for cleanup if needed
    return subscription;
  },

  /**
   * Signs in a user with their email and password.
   */
  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      if (!isValidEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Signs up a new user.
   */
  signUp: async (email, password, fullName) => {
    set({ loading: true });
    try {
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedFullName = fullName ? sanitizeInput(fullName) : sanitizedEmail.split('@')[0];

      if (!isValidEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: sanitizedFullName,
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Initiates the Google OAuth flow for both sign-in and sign-up.
   * Handles both new and existing users automatically.
   */
  continueWithGoogle: async () => {
    console.log('🚀 Initiating Google OAuth flow');
    set({ loading: true });
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      
      if (error) {
        console.error('❌ Google OAuth error:', error.message);
        throw error;
      }
      
      console.log('✅ Google OAuth initiated successfully');
      // User will be redirected to Google, then back to app
      // onAuthStateChange will handle the session
      return { error: null };
    } catch (error: any) {
      console.error('❌ Google OAuth failed:', error);
      set({ loading: false });
      return { error };
    }
  },

  /**
   * Signs out the current user.
   */
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, isAuthenticated: false });
  },

  /**
   * Sends a password reset email.
   */
  resetPassword: async (email) => {
    try {
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        if (!isValidEmail(sanitizedEmail)) {
            throw new Error('Invalid email format');
        }
        const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        return { error: null };
    } catch (error: any) {
        return { error };
    }
  },

  /**
   * Updates the current user's profile.
   */
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { error: new Error('No user is logged in.') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      set(state => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      }));
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },


  /**
   * Loads the user's profile from the database.
   */
  loadProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  },

  /**
   * Private helper to load the user's profile from the database.
   * Should be called internally after authentication.
   * @private
   */
  _loadProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  },

  /**
   * Private helper to handle post-sign-in logic, like creating a profile for a new user.
   * @private
   */
  _handleSignIn: async () => {
    const { user } = get();
    if (!user) return;

    console.log('👤 Handling user sign-in for:', user.email);
    const isGoogleUser = user.app_metadata?.provider === 'google';

    try {
      // Check if a profile already exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // If there's an error and it's not "No rows found", something went wrong
      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      // If no profile exists, create one
      if (!existingProfile) {
        const displayName = isGoogleUser 
          ? (user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0])
          : (user.user_metadata.display_name || user.email?.split('@')[0]);
          
        const avatarUrl = isGoogleUser 
          ? (user.user_metadata.avatar_url || user.user_metadata.picture)
          : user.user_metadata.avatar_url;

        console.log('📝 Creating new profile for user:', displayName);
        
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
        });
        
        if (upsertError) throw upsertError;
        console.log('✅ Profile created successfully');
      } else {
        console.log('👤 Existing profile found');
      }
      
      // Load the profile into the store
      await get()._loadProfile();
      
      // No need to redirect for Google users - they're already where they should be
      // The routing will handle showing the correct page based on auth state
      console.log('✅ Google user authentication completed successfully');

    } catch (error) {
      console.error('❌ Error handling sign-in:', error);
    }
  },
}));

// Initialize the store once - prevent multiple initializations
let isStoreInitialized = false;
if (!isStoreInitialized) {
  isStoreInitialized = true;
  useAuthStore.getState().initialize();
}
