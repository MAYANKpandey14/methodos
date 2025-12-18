import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

/**
 * Handles Supabase OAuth redirect.
 *
 * This page explicitly exchanges the OAuth code for a session and waits for
 * the auth store to sync before navigating. This prevents race conditions where
 * the ProtectedRoute sees stale auth state and redirects back to login.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // Also check for hash fragment tokens (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");

        // Handle PKCE flow (code exchange)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Error exchanging code for session:", error);
            throw error;
          }
        }

        // If we have hash fragment tokens, supabase-js should handle them via
        // onAuthStateChange, but let's trigger a session refresh to be safe
        if (accessToken || code) {
          await supabase.auth.getSession();
        }

        // Wait for the auth store to update (max 5 seconds)
        // The onAuthStateChange listener in authStore will update isAuthenticated
        const maxWait = 5000;
        const pollInterval = 100;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait && !cancelled) {
          // Check if auth state has synchronized
          const { isAuthenticated, loading } = useAuthStore.getState();

          if (isAuthenticated && !loading) {
            break;
          }

          // Wait before next check
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        if (!cancelled) {
          const { isAuthenticated } = useAuthStore.getState();

          if (isAuthenticated) {
            navigate("/", { replace: true });
          } else {
            // Auth didn't sync in time or failed
            console.warn("Auth state did not sync after OAuth callback");
            navigate("/login", { replace: true });
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        if (!cancelled) {
          navigate("/login", { replace: true });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <div className="mx-auto animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
