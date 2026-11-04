import { useEffect, useRef, useState } from "react";

interface SignInPageProps {
  onSignIn: (credential: string) => Promise<void>;
}

export function SignInPage({ onSignIn }: SignInPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customToken, setCustomToken] = useState("");
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

  const handleCustomSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToken) return;
    setLoading(true);
    setError(null);
    try {
      await onSignIn(customToken);
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

        {/* Official Google Identity Services button container */}
        {googleClientId && (
          <div
            ref={googleButtonRef}
            style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}
          />
        )}

        {/* Development & Fallback Google button */}
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

        <form onSubmit={handleCustomSignIn} style={{ marginTop: 20 }}>
          <div className="field">
            <span>Direct Google ID Token / Subject</span>
            <input
              type="text"
              placeholder="Paste Google JWT id_token or test identifier"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="secondary-button wide"
            style={{ marginTop: 10 }}
            disabled={loading || !customToken}
          >
            Sign in with Token
          </button>
        </form>

        <p className="provider-note">
          Direct Google authentication verified securely via Google Identity Services.
        </p>
      </div>
    </div>
  );
}
