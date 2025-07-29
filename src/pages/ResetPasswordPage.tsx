import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';

// Security: Whitelist of allowed redirect URLs after password reset
const ALLOWED_REDIRECT_URLS = [
  window.location.origin,
  `${window.location.origin}/login`,
  `${window.location.origin}/dashboard`
];

const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters and limit length
  return input.replace(/[<>\"'&]/g, '').substring(0, 100);
};

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Security: Validate the password reset session
    const validateResetSession = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Security: Ensure this is actually a password reset request
        if (type !== 'recovery') {
          console.error('Invalid reset type');
          navigate('/login');
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            toast({
              title: 'Invalid Reset Link',
              description: 'This password reset link is invalid or has expired.',
              variant: 'destructive',
            });
            navigate('/login');
            return;
          }

          setIsValidSession(true);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Reset validation error:', error);
        navigate('/login');
      }
    };

    validateResetSession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Input validation and sanitization
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);
    
    if (sanitizedPassword !== sanitizedConfirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    // Security: Enhanced password validation
    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: 'Password Requirements Not Met',
        description: passwordValidation.errors.join(' '),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: sanitizedPassword
      });

      if (error) {
        // Security: Don't expose internal error details
        console.error('Password update error:', error);
        toast({
          title: 'Error',
          description: 'Failed to update password. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success!',
        description: 'Your password has been updated successfully.',
      });

      // Security: Sign out after password reset to force re-authentication
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md relative">
          <div className="absolute top-0 right-0 -mt-16">
            <ThemeToggle />
          </div>
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Validating Reset Link</CardTitle>
              <CardDescription>
                Please wait while we validate your password reset link...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md relative">
        <div className="absolute top-0 right-0 -mt-16">
          <ThemeToggle />
        </div>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it meets all security requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your new password"
                  minLength={8}
                  maxLength={100}
                />
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Confirm your new password"
                  minLength={8}
                  maxLength={100}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
