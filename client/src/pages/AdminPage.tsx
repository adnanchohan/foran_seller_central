import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { apiRequest, downloadAdminDocument } from '../lib/api';
import type { ApplicationStatus, StoreApplication, UploadedDocument } from '../types';

const filters: Array<{ label: string; value: ApplicationStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING_REVIEW' },
  { label: 'Changes Required', value: 'CHANGES_REQUIRED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Drafts', value: 'DRAFT' },
];

function populatedUser(application: StoreApplication) {
  return typeof application.user === 'string' ? null : application.user;
}

function populatedDocument(value: UploadedDocument | string | null) {
  return value && typeof value !== 'string' ? value : null;
}

function statusLabel(status: ApplicationStatus) {
  return status.toLowerCase().replaceAll('_', ' ');
}

export function AdminPage() {
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('PENDING_REVIEW');
  const [applications, setApplications] = useState<StoreApplication[]>([]);
  const [selected, setSelected] = useState<StoreApplication | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'ALL' ? '' : `?status=${filter}`;
      const result = await apiRequest<{ applications: StoreApplication[] }>(
        `/admin/applications${query}`,
      );
      setApplications(result.applications);
      if (selected) {
        const stillVisible = result.applications.find((item) => item._id === selected._id);
        if (!stillVisible) setSelected(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, [filter, selected]);

  useEffect(() => {
    void loadApplications();
  }, [filter]); // load only when the filter changes

  async function openApplication(applicationId: string) {
    setError('');
    try {
      const result = await apiRequest<{ application: StoreApplication }>(
        `/admin/applications/${applicationId}`,
      );
      setSelected(result.application);
      setNote(result.application.reviewNote || '');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open the application.');
    }
  }

  async function makeDecision(decision: 'APPROVE' | 'REQUEST_CHANGES') {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/admin/applications/${selected._id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, note }),
      });
      setSelected(null);
      setNote('');
      await loadApplications();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The decision could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  const counts = useMemo(
    () => ({
      visible: applications.length,
      pending: applications.filter((item) => item.status === 'PENDING_REVIEW').length,
      approved: applications.filter((item) => item.status === 'APPROVED').length,
    }),
    [applications],
  );

  const documents = selected
    ? [
        ['Store banner', populatedDocument(selected.bannerUpload)],
        ['Store logo', populatedDocument(selected.logoUpload)],
        ['CNIC front', populatedDocument(selected.cnicFrontUpload)],
        ['CNIC back', populatedDocument(selected.cnicBackUpload)],
        ['Company document', populatedDocument(selected.companyDocumentUpload)],
      ] as const
    : [];

  return (
    <PageLayout>
      <section className="admin-shell">
        <aside className="admin-sidebar">
          <div><span className="admin-shield">✓</span><strong>Administration</strong><small>Manual verification console</small></div>
          <nav>
            <button className="active" type="button">Review Queue</button>
            <button disabled type="button">Users <small>Later</small></button>
            <button disabled type="button">Plans <small>Later</small></button>
            <button disabled type="button">Payments <small>Later</small></button>
          </nav>
        </aside>
        <div className="admin-content">
          <div className="admin-heading">
            <div><span className="eyebrow">Administrator portal</span><h1>Seller Application Review</h1><p>Inspect every field and identity document before unlocking seller plans.</p></div>
            <span className="secure-admin-badge">Restricted access</span>
          </div>

          {error && <div className="alert error">{error}</div>}

          <div className="admin-metrics">
            <div><small>Visible records</small><strong>{counts.visible}</strong></div>
            <div><small>Pending in view</small><strong>{counts.pending}</strong></div>
            <div><small>Approved in view</small><strong>{counts.approved}</strong></div>
          </div>

          <div className="admin-workspace">
            <section className="review-list-panel">
              <div className="filter-row">
                {filters.map((item) => (
                  <button className={filter === item.value ? 'active' : ''} onClick={() => setFilter(item.value)} type="button" key={item.value}>{item.label}</button>
                ))}
              </div>
              {loading ? <div className="empty-state"><span className="spinner" />Loading applications…</div> : applications.length === 0 ? (
                <div className="empty-state">No applications match this filter.</div>
              ) : (
                <div className="review-list">
                  {applications.map((application) => {
                    const user = populatedUser(application);
                    return (
                      <button className={`review-row ${selected?._id === application._id ? 'selected' : ''}`} onClick={() => void openApplication(application._id)} type="button" key={application._id}>
                        <span className="store-avatar">{application.storeName.slice(0, 1).toUpperCase() || '?'}</span>
                        <span><strong>{application.storeName || 'Untitled draft'}</strong><small>{user?.email || 'Seller account'} · Version {application.version}</small></span>
                        <span className={`status-chip ${application.status.toLowerCase()}`}>{statusLabel(application.status)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="review-detail-panel">
              {!selected ? (
                <div className="empty-detail"><span>▤</span><h2>Select an application</h2><p>Choose a record from the review queue to inspect its fields and documents.</p></div>
              ) : (
                <div className="review-detail">
                  <div className="review-detail-heading">
                    <div><span className={`status-chip ${selected.status.toLowerCase()}`}>{statusLabel(selected.status)}</span><h2>{selected.storeName}</h2><p>{populatedUser(selected)?.email}</p></div>
                    <span>v{selected.version}</span>
                  </div>

                  <div className="detail-section">
                    <h3>Store and business</h3>
                    <dl className="detail-grid">
                      <div><dt>Seller type</dt><dd>{selected.sellerType}</dd></div>
                      <div><dt>Category</dt><dd>{selected.category}</dd></div>
                      <div className="full"><dt>Description</dt><dd>{selected.description}</dd></div>
                    </dl>
                  </div>
                  <div className="detail-section">
                    <h3>Pickup details</h3>
                    <dl className="detail-grid">
                      <div className="full"><dt>Address</dt><dd>{selected.warehouseAddress}</dd></div>
                      <div><dt>City / area</dt><dd>{selected.pickupCity}, {selected.pickupArea}</dd></div>
                      <div><dt>Coordinator</dt><dd>{selected.pickupContactPerson}<br />{selected.pickupContactMobile}</dd></div>
                      <div><dt>CNIC</dt><dd>{selected.cnicNumber}</dd></div>
                    </dl>
                  </div>
                  <div className="detail-section">
                    <h3>Verification documents</h3>
                    <div className="document-list">
                      {documents.filter(([, document]) => document).map(([label, document]) => (
                        <button key={label} type="button" onClick={() => void downloadAdminDocument(document!._id || document!.id!, document!.originalName)}>
                          <span>⇩</span><span><strong>{label}</strong><small>{document!.originalName}</small></span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selected.status === 'PENDING_REVIEW' ? (
                    <div className="decision-box">
                      <label className="field"><span>Reviewer note</span><textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required when requesting changes; optional for approval." /></label>
                      <div className="button-row">
                        <button className="danger-button" onClick={() => void makeDecision('REQUEST_CHANGES')} disabled={busy} type="button">Request Changes</button>
                        <button className="primary-button" onClick={() => void makeDecision('APPROVE')} disabled={busy} type="button">Approve Seller ✓</button>
                      </div>
                    </div>
                  ) : selected.reviewNote ? (
                    <div className="review-note"><small>Latest review note</small><p>{selected.reviewNote}</p></div>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
