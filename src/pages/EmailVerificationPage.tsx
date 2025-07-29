import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '@/integrations/supabase/client';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Handle email confirmation tokens from URL
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type === 'signup') {
        setIsVerifying(true);
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (data.user?.email_confirmed_at) {
            localStorage.removeItem('pendingVerificationEmail');
            toast({
              title: 'Email verified successfully!',
              description: 'Welcome to FocusFlow! Your account is now active.',
            });
            navigate('/');
          }
        } catch (error) {
          console.error('Email verification error:', error);
          toast({
            title: 'Verification failed',
            description: 'There was an error verifying your email. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsVerifying(false);
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('pendingVerificationEmail', emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }

    // If user is already authenticated with confirmed email, redirect to dashboard
    if (isAuthenticated && user?.email_confirmed_at) {
      localStorage.removeItem('pendingVerificationEmail');
      navigate('/');
      toast({
        title: 'Welcome to FocusFlow!',
        description: 'Your email has been verified successfully.',
      });
    }
  }, [user, isAuthenticated, navigate, searchParams, toast]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'No email address found. Please try signing up again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the verification link.',
      });
    } catch (error: any) {
      console.error('Resend email error:', error);
      toast({
        title: 'Error sending email',
        description: error.message || 'Failed to resend verification email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardContent className="text-center pt-6">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We've sent a verification link to {email && <><br /><strong>{email}</strong></>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Click the link in your email to verify your account</span>
              </div>
              
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationPage;