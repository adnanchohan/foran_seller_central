import { useEffect, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { apiRequest } from '../lib/api';
import type { AppUser, DemoPayment, StoreApplication } from '../types';

interface DashboardData {
  user: AppUser;
  application: StoreApplication;
  payment: DemoPayment;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<DashboardData>('/dashboard')
      .then(setData)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load the dashboard.'));
  }, []);

  return (
    <PageLayout>
      <section className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <strong>Seller Workspace</strong>
          <nav>
            <a className="active" href="#overview">Overview</a>
            <span>Products <small>Later</small></span>
            <span>Orders <small>Later</small></span>
            <span>Payments <small>Later</small></span>
            <span>Settings <small>Later</small></span>
          </nav>
        </aside>
        <div className="dashboard-content" id="overview">
          {error && <div className="alert error">{error}</div>}
          {!data ? (
            <div className="status-card"><span className="spinner" /><h2>Loading dashboard…</h2></div>
          ) : (
            <>
              <div className="dashboard-welcome">
                <div><span className="eyebrow">Temporary dashboard</span><h1>Welcome, {data.application.storeName}</h1><p>Your full seller dashboard design can replace this page without changing the onboarding API.</p></div>
                <span className="verified-pill">✓ Verified Seller</span>
              </div>
              <div className="metric-grid">
                <article><small>Application</small><strong>Approved</strong><span>Version {data.application.version}</span></article>
                <article><small>Selected plan</small><strong>{data.user.plan}</strong><span>Saved on user record</span></article>
                <article><small>Store slug</small><strong className="small-value">{data.application.storeSlug}</strong><span>Public URL reserved</span></article>
                <article><small>Payment state</small><strong>Demo completed</strong><span>No money collected</span></article>
              </div>
              <div className="dashboard-panels">
                <section className="form-card">
                  <div className="section-heading"><span><small>Getting started</small><h2>Next seller actions</h2></span></div>
                  <ul className="task-list">
                    <li><span>1</span><div><strong>Add your first product</strong><small>Product management will be added with the final dashboard.</small></div></li>
                    <li><span>2</span><div><strong>Confirm fulfillment timings</strong><small>Pickup address: {data.application.pickupCity}, {data.application.pickupArea}</small></div></li>
                    <li><span>3</span><div><strong>Configure payouts</strong><small>Bank and wallet onboarding will be implemented later.</small></div></li>
                  </ul>
                </section>
                <section className="form-card compact-panel">
                  <div className="section-heading"><span><small>Account snapshot</small><h2>Merchant profile</h2></span></div>
                  <dl className="detail-list">
                    <div><dt>Owner</dt><dd>{data.user.displayName || data.user.email}</dd></div>
                    <div><dt>Business type</dt><dd>{data.application.sellerType}</dd></div>
                    <div><dt>Category</dt><dd>{data.application.category}</dd></div>
                    <div><dt>Support</dt><dd>seller-support@foran.pk</dd></div>
                  </dl>
                </section>
              </div>
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
