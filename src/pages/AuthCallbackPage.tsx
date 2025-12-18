import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

/**
 * Handles Supabase OAuth redirect.
 *
 * This page explicitly exchanges the OAuth code for a session. This prevents cases
 * where the session isn't persisted yet when the app immediately renders protected routes.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // If we have a PKCE code in the URL, exchange it for a session.
        // supabase-js will often do this automatically, but doing it explicitly
        // avoids timing issues across different environments.
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }

        // Refresh store state now that the session should exist.
        await supabase.auth.getSession();
        useAuthStore.getState().initialize();

        if (!cancelled) {
          navigate("/", { replace: true });
        }
      } catch {
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
