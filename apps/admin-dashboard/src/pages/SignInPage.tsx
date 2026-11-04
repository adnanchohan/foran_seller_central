import { useEffect, useRef, useState } from "react";

interface SignInPageProps {
  onSignIn: (credential: string) => Promise<void>;
}

export function SignInPage({ onSignIn }: SignInPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId =
    import.meta.env.VITE_GOOGLE_ADMIN_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
                setError(err instanceof Error ? err.message : "Admin Google sign-in failed");
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
            text: "signin_with",
          });
        }
      } catch (err) {
        console.error("Failed to initialize Google Identity Services:", err);
      }
    }
  }, [googleClientId, onSignIn]);

  const handleDevAdminSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSignIn("admin-token");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      await onSignIn(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-card">
        <div className="auth-copy">
          <div
            className="auth-icon"
            style={{ background: "var(--error-soft)", color: "var(--error)" }}
            aria-hidden="true"
          >
            🛡️
          </div>
          <h1>Admin Portal Login</h1>
          <p>Restricted access for Foran compliance officers and reviewers.</p>
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

        {/* Development & Fallback button */}
        {(!googleClientId || !window.google) && (
          <button
            type="button"
            className="provider-button google-button"
            onClick={handleDevAdminSignIn}
            disabled={loading}
          >
            <span className="google-g" aria-hidden="true">
              G
            </span>
            <span>{loading ? "Authenticating..." : "Admin Google Single Sign-On"}</span>
          </button>
        )}

        <form onSubmit={handleCustomSignIn} style={{ marginTop: 20 }}>
          <div className="field">
            <span>Admin Token / Credential</span>
            <input
              type="text"
              placeholder="e.g. admin-token or Google JWT"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="secondary-button wide"
            style={{ marginTop: 10 }}
            disabled={loading || !adminToken}
          >
            Sign in as Administrator
          </button>
        </form>
      </div>
    </div>
  );
}
