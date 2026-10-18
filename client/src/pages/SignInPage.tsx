import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PageLayout } from '../components/PageLayout';

export function SignInPage() {
  const { appUser, loading, error: authError, signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!loading && appUser) return <Navigate to="/" replace />;

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <section className="auth-page">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="auth-card">
          <div className="auth-card-topline">
            <div>
              <span className="eyebrow">Merchant Portal</span>
              <small>Islamic Republic of Pakistan</small>
            </div>
            <span className="country-pill">🇵🇰 PKR / Pakistan</span>
          </div>

          <div className="auth-copy">
            <span className="auth-icon" aria-hidden="true">✦</span>
            <h1>Welcome to Seller Central</h1>
            <p>Use an approved identity provider to create your account or sign back in.</p>
          </div>

          {(error || authError) && <div className="alert error" role="alert">{error || authError}</div>}

          <button
            className="provider-button google-button"
            onClick={handleGoogleSignIn}
            disabled={submitting || loading}
            type="button"
          >
            <span className="google-g" aria-hidden="true">G</span>
            {submitting ? 'Connecting to Google…' : 'Continue with Google'}
          </button>

          <button className="provider-button" disabled type="button" aria-describedby="apple-note">
            <span aria-hidden="true">●</span>
            Continue with Apple
            <small className="coming-soon">Coming later</small>
          </button>
          <p className="provider-note" id="apple-note">
            Google is the only enabled provider for the first release. There is no manual password account.
          </p>

          <div className="secure-note">
            <span aria-hidden="true">▣</span>
            <span>
              <strong>Provider-secured access</strong>
              Firebase confirms your identity; Foran.pk stores only the seller profile needed for onboarding.
            </span>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
