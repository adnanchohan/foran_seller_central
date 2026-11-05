import { useEffect, useRef, useState } from "react";

interface SignInPageProps {
  onSignIn: (credential: string) => Promise<void>;
}

export function SignInPage({ onSignIn }: SignInPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId =
    import.meta.env.VITE_GOOGLE_SELLER_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          callback: (response) => {
            if (response.credential) {
              setLoading(true);
              setError(null);
              onSignIn(response.credential).catch((err) => {
                setError(err instanceof Error ? err.message : "Google Sign-In failed");
                setLoading(false);
              });
            }
          },
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            width: 340,
            text: "continue_with",
          });
        }
      } catch (err) {
        console.error("Failed to initialize Google Identity Services:", err);
      }
    }
  }, [googleClientId, onSignIn]);

  const handleDevSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSignIn("dummy-seller-token");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-card">
        <div className="auth-copy">
          <div className="auth-icon" aria-hidden="true">
            🔐
          </div>
          <h1>Foran Seller Platform</h1>
          <p>
            Sign in with your Google account to onboard your store and manage your catalog on the
            seller platform.
          </p>
        </div>

        {error && (
          <div className="alert error" role="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {/* Official Google Identity Services button container */}
          {googleClientId && (
            <div
              ref={googleButtonRef}
              style={{ display: "flex", justifyContent: "center", minHeight: 44 }}
            />
          )}

          {/* Fallback button when Google script is not available */}
          {(!googleClientId || !window.google) && (
            <button
              type="button"
              className="provider-button google-button"
              onClick={handleDevSignIn}
              disabled={loading}
            >
              <span className="google-g" aria-hidden="true">
                G
              </span>
              <span>{loading ? "Signing in..." : "Continue with Google"}</span>
            </button>
          )}

          {/* Sign in with Apple button (Disabled) */}
          <button
            type="button"
            className="provider-button apple-button"
            disabled={true}
            aria-disabled="true"
            title="Sign in with Apple (Coming Soon)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 170 170"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.74-11.64-14.1-5.78-9.08-10.15-19.16-13.12-30.24-2.97-11.08-4.46-21.72-4.46-31.92 0-14.67 3.69-26.65 11.06-35.94 7.37-9.3 16.5-14.07 27.38-14.32 4.69 0 9.87 1.25 15.54 3.75 5.66 2.5 9.4 3.82 11.22 3.96 1.83-.14 5.75-1.5 11.75-4.08 6.01-2.58 11.02-3.76 15.03-3.53 11.64.65 21.01 4.96 28.1 12.92-10.22 6.22-15.22 15-15 26.34.22 8.92 3.59 16.31 10.1 22.17 6.51 5.86 14.18 9.25 23 10.16-2.18 6.54-4.8 13.08-7.85 19.63zM119.22 31.84c0-7.72 2.76-14.89 8.27-21.51 5.51-6.62 12.29-10.33 20.35-11.13.22 1.3.33 2.45.33 3.44 0 7.61-2.89 14.88-8.67 21.8-5.78 6.92-12.69 10.74-20.73 11.46-.22-1.3-.35-2.65-.4-4.06h.85z" />
            </svg>
            <span>Sign in with Apple</span>
            <span className="coming-soon">Coming Soon</span>
          </button>
        </div>
      </div>
    </div>
  );
}
