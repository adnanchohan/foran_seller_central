import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { apiRequest } from '../lib/api';

const planDetails = {
  BASIC: { name: 'Basic Account', amount: 5000 },
  PREMIUM: { name: 'Premium Account', amount: 15999 },
} as const;

export function PaymentPage() {
  const { appUser, refreshAppUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  if (!appUser?.plan) return <Navigate to="/onboarding/plans" replace />;
  const selectedPlan = planDetails[appUser.plan];

  async function handlePlaceholderPayment() {
    setBusy(true);
    setError('');
    try {
      await apiRequest('/payments/placeholder', { method: 'POST' });
      await refreshAppUser();
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not complete the placeholder step.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingLayout
      step={4}
      eyebrow="Final onboarding step"
      title="Store Placement Payment / سٹور پلیسمنٹ ادائیگی"
      description="The payment experience is prepared visually, but no payment provider is connected in this release."
    >
      <div className="payment-layout">
        <section className="payment-main">
          <div className="selected-plan-banner">
            <span className="medal-icon">★</span>
            <div><small>Selected seller plan</small><h2>{selectedPlan.name}</h2><p>Your preference is saved to your account.</p></div>
            <strong>Rs {selectedPlan.amount.toLocaleString()}</strong>
          </div>

          <div className="form-card">
            <div className="section-heading">
              <span><small>Gateway preview</small><h2>Select Payment Method</h2></span>
              <span className="coming-soon-tag">Integration later</span>
            </div>
            <div className="payment-methods">
              {[
                ['▣', 'Debit / Credit Card', 'Visa, Mastercard, PayPak'],
                ['⌗', 'Raast QR / Alias', 'Instant digital payment'],
                ['▯', 'Mobile Wallets', 'JazzCash and Easypaisa'],
                ['▥', 'Online Bank IBAN', 'Supported Pakistani banks'],
              ].map(([icon, title, text]) => (
                <div className="payment-method disabled" key={title}>
                  <span>{icon}</span><strong>{title}</strong><small>{text}</small>
                </div>
              ))}
            </div>
            <div className="placeholder-payment-box">
              <span aria-hidden="true">i</span>
              <div>
                <strong>No financial information will be collected</strong>
                <p>The button below records a development placeholder and opens the temporary dashboard. It does not charge a card, wallet, or bank account.</p>
              </div>
            </div>
          </div>

          <div className="trust-grid">
            <div><span>⌁</span><strong>Provider-ready API</strong><small>A gateway adapter can be connected later.</small></div>
            <div><span>✓</span><strong>Admin verified</strong><small>Your store passed manual review.</small></div>
            <div><span>◫</span><strong>Auditable state</strong><small>The demo transition is labelled clearly.</small></div>
          </div>
        </section>

        <aside className="order-summary">
          <div className="summary-heading"><h2>Summary / کل تفصیل</h2><span>DEMO</span></div>
          <dl>
            <div><dt>Selected plan</dt><dd>{selectedPlan.name}</dd></div>
            <div><dt>Catalog amount</dt><dd>Rs {selectedPlan.amount.toLocaleString()}</dd></div>
            <div><dt>Payment provider</dt><dd>Not connected</dd></div>
            <div><dt>Charged now</dt><dd className="free-label">Rs 0</dd></div>
          </dl>
          <div className="summary-total"><span>Displayed plan amount</span><strong>Rs {selectedPlan.amount.toLocaleString()}</strong></div>
          {error && <div className="alert error compact">{error}</div>}
          <button className="primary-button wide" onClick={handlePlaceholderPayment} disabled={busy} type="button">
            {busy ? 'Preparing dashboard…' : 'Pay Now & Continue'} <span>→</span>
          </button>
          <small className="summary-disclaimer">Development flow only — no payment is processed.</small>
        </aside>
      </div>

      {success && (
        <div className="modal-backdrop" role="presentation">
          <div className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
            <span className="success-check">✓</span>
            <span className="status-badge">Seller account activated</span>
            <h2 id="success-title">Registration Done!</h2>
            <p className="urdu-copy">رجسٹریشن کامیابی کے ساتھ مکمل ہوگئی</p>
            <p>Your approved store is ready. The payment entry is a clearly marked development placeholder.</p>
            <button className="primary-button wide" onClick={() => navigate('/dashboard')} type="button">
              Open Seller Dashboard <span>→</span>
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
