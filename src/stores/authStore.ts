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
  
  // For development/testing, allow authenticated users even without email confirmation
  // In production, you might want to enforce email confirmation
  return true;
  
  // Uncomment the lines below to enforce email confirmation:
  // const isEmailConfirmed = !!session.user.email_confirmed_at;
  // return isEmailConfirmed;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuthenticated = isUserAuthenticated(session);
      set({ 
        user: session?.user ?? null, 
        session, 
        isAuthenticated,
        loading: false 
      });
      if (isAuthenticated) {
        get()._loadProfile();
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      const isAuthenticated = isUserAuthenticated(session);
      
      set({ 
        user: session?.user ?? null, 
        session, 
        isAuthenticated,
        loading: false 
      });

      if (event === 'SIGNED_IN' && isAuthenticated) {
        get()._handleSignIn();
      } else if (event === 'SIGNED_OUT') {
        set({ profile: null });
      }
    });
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

    try {
      // Check if a profile already exists.
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // If there's an error and it's not "No rows found", something went wrong.
      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      // If no profile exists, create one.
      if (!existingProfile) {
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: user.id,
          display_name: user.user_metadata.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata.avatar_url,
        });
        if (upsertError) throw upsertError;
      }
      
      // Finally, load the profile into the store.
      get()._loadProfile();

    } catch (error) {
        console.error('Error handling sign-in:', error);
    }
  },
}));

// Initialize the store once in your app's entry point (e.g., App.tsx or main.tsx)
useAuthStore.getState().initialize();
