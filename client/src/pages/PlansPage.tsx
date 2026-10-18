import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { apiRequest } from '../lib/api';
import type { SellerPlan, StoreApplication } from '../types';

const plans = [
  {
    id: 'BASIC' as const,
    name: 'Basic Account',
    price: 'Rs 5,000',
    badge: 'Standard Seller',
    description: 'For independent retailers, home businesses, and merchants beginning online sales.',
    features: [
      'Unlimited product listings',
      'Custom categories and subcategories',
      '20 promotional video reels per month',
      'Same-day intra-city delivery target',
      'Weekly payout schedule',
      'Standard branded packaging',
    ],
  },
  {
    id: 'PREMIUM' as const,
    name: 'Premium Account',
    price: 'Rs 15,999',
    badge: 'Most Popular',
    description: 'For scaling brands and high-volume merchants needing priority fulfillment.',
    features: [
      'Verified Gold Seller badge',
      'Priority delivery service target',
      'Limited fulfillment storage allocation',
      'Unlimited promotional video reels',
      'Dedicated rider allocation target',
      'Managed inventory support',
    ],
  },
];

export function PlansPage() {
  const { appUser, refreshAppUser } = useAuth();
  const [selected, setSelected] = useState<SellerPlan>(appUser?.plan || 'PREMIUM');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function verifyApproval() {
      try {
        const { application } = await apiRequest<{ application: StoreApplication | null }>(
          '/onboarding/me/application',
        );
        if (application?.status !== 'APPROVED') navigate('/onboarding/approval', { replace: true });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not verify your application.');
      }
    }
    void verifyApproval();
  }, [navigate]);

  async function continueToPayment() {
    setBusy(true);
    setError('');
    try {
      await apiRequest('/onboarding/me/plan', {
        method: 'PUT',
        body: JSON.stringify({ plan: selected }),
      });
      await refreshAppUser();
      navigate('/onboarding/payment');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The plan preference could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingLayout
      step={3}
      eyebrow="Transparent merchant pricing"
      title="Select the Tier Built for Your Business"
      description="This step records your preference only. Your selected plan is saved directly on your user account."
    >
      <section className="plans-section">
        {error && <div className="alert error">{error}</div>}
        <div className="plan-grid">
          {plans.map((plan) => (
            <article className={`plan-card ${plan.id === 'PREMIUM' ? 'featured' : ''} ${selected === plan.id ? 'selected' : ''}`} key={plan.id}>
              <div className="plan-card-header">
                <span className="plan-badge">{plan.badge}</span>
                <span className="plan-tier">{plan.id === 'BASIC' ? 'TIER 01' : 'TIER 02'}</span>
              </div>
              <h2>{plan.name}</h2>
              <p>{plan.description}</p>
              <div className="price-box"><small>ONE-TIME CATALOG PRICE</small><strong>{plan.price}</strong><span>Displayed for preference selection</span></div>
              <ul className="feature-list">
                {plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}
              </ul>
              <button
                className={selected === plan.id ? 'primary-button' : 'secondary-button'}
                onClick={() => setSelected(plan.id)}
                type="button"
              >
                {selected === plan.id ? `Selected ${plan.name}` : `Select ${plan.name}`}
              </button>
            </article>
          ))}
        </div>
        <div className="sticky-action-bar">
          <button className="text-button" onClick={() => navigate('/onboarding/approval')} type="button">← Back to Approval</button>
          <div><small>Current preference</small><strong>{selected === 'BASIC' ? 'Basic Account' : 'Premium Account'}</strong></div>
          <button className="primary-button" onClick={continueToPayment} disabled={busy} type="button">
            {busy ? 'Saving preference…' : 'Save Plan & Continue'} <span>→</span>
          </button>
        </div>
      </section>
    </OnboardingLayout>
  );
}
