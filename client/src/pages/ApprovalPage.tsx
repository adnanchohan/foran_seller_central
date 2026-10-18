import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { apiRequest } from '../lib/api';
import type { StoreApplication } from '../types';

const statusCopy = {
  PENDING_REVIEW: {
    badge: 'Under manual review',
    title: 'Your application is with our verification team',
    description: 'An administrator is checking your store details, CNIC, pickup location, and uploaded documents.',
    icon: '⌛',
  },
  CHANGES_REQUIRED: {
    badge: 'Action required',
    title: 'Please update and resubmit your application',
    description: 'The reviewer found information that needs your attention. Your saved form is ready to edit.',
    icon: '!',
  },
  APPROVED: {
    badge: 'Application approved',
    title: 'Your store verification is complete',
    description: 'The Plan & Rates step is now unlocked. Choose the catalog option you prefer.',
    icon: '✓',
  },
} as const;

export function ApprovalPage() {
  const [application, setApplication] = useState<StoreApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadApplication = useCallback(async () => {
    setError('');
    try {
      const result = await apiRequest<{ application: StoreApplication | null }>(
        '/onboarding/me/application',
      );
      if (!result.application || result.application.status === 'DRAFT') {
        navigate('/onboarding/store', { replace: true });
        return;
      }
      setApplication(result.application);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not check the approval status.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadApplication();
    const timer = window.setInterval(() => void loadApplication(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadApplication]);

  const status = application?.status && application.status !== 'DRAFT'
    ? statusCopy[application.status]
    : null;

  return (
    <OnboardingLayout
      step={2}
      eyebrow="Verification checkpoint"
      title="Application Approval / درخواست کی منظوری"
      description="Your approval status is saved to your account and will be restored whenever you sign in again."
    >
      <section className="centered-section">
        {error && <div className="alert error">{error}</div>}
        {loading && <div className="status-card"><span className="spinner" /><h2>Checking your application…</h2></div>}
        {status && application && (
          <div className={`status-card status-${application.status.toLowerCase()}`}>
            <span className="large-status-icon" aria-hidden="true">{status.icon}</span>
            <span className="status-badge">{status.badge}</span>
            <h2>{status.title}</h2>
            <p>{status.description}</p>

            <div className="application-summary">
              <div><small>Store</small><strong>{application.storeName}</strong></div>
              <div><small>Application version</small><strong>#{application.version}</strong></div>
              <div><small>Submitted</small><strong>{application.submittedAt ? new Date(application.submittedAt).toLocaleString() : 'Not submitted'}</strong></div>
            </div>

            {application.status === 'PENDING_REVIEW' && (
              <>
                <div className="review-progress">
                  <span className="pulse-dot" />
                  <span>Review in progress. This page checks for updates automatically.</span>
                </div>
                <button className="secondary-button" onClick={() => void loadApplication()} type="button">Refresh status</button>
              </>
            )}

            {application.status === 'CHANGES_REQUIRED' && (
              <>
                <div className="review-note">
                  <small>Reviewer’s instructions</small>
                  <p>{application.reviewNote}</p>
                </div>
                <button className="primary-button" onClick={() => navigate('/onboarding/store')} type="button">
                  Edit &amp; Resubmit Application <span>→</span>
                </button>
              </>
            )}

            {application.status === 'APPROVED' && (
              <>
                <div className="alert success compact">Verification completed successfully. No further identity action is required.</div>
                <button className="primary-button" onClick={() => navigate('/onboarding/plans')} type="button">
                  Continue to Plan &amp; Rates <span>→</span>
                </button>
              </>
            )}
          </div>
        )}

        <div className="support-strip">
          <span aria-hidden="true">?</span>
          <div><strong>Questions about the review?</strong><small>Contact seller-support@foran.pk with your store name.</small></div>
        </div>
      </section>
    </OnboardingLayout>
  );
}
