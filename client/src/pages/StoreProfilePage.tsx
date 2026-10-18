import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { ApiError, apiRequest, uploadDocument } from '../lib/api';
import type { StoreApplication, UploadedDocument } from '../types';

interface StoreFormState {
  sellerType: 'individual' | 'company';
  storeName: string;
  category: string;
  description: string;
  warehouseAddress: string;
  pickupCity: string;
  pickupArea: string;
  pickupContactPerson: string;
  pickupContactMobile: string;
  cnicNumber: string;
  bannerUpload: string | null;
  logoUpload: string | null;
  cnicFrontUpload: string | null;
  cnicBackUpload: string | null;
  companyDocumentUpload: string | null;
}

type UploadField =
  | 'bannerUpload'
  | 'logoUpload'
  | 'cnicFrontUpload'
  | 'cnicBackUpload'
  | 'companyDocumentUpload';

const uploadTypes: Record<UploadField, string> = {
  bannerUpload: 'store-banner',
  logoUpload: 'store-logo',
  cnicFrontUpload: 'cnic-front',
  cnicBackUpload: 'cnic-back',
  companyDocumentUpload: 'company-document',
};

const initialForm: StoreFormState = {
  sellerType: 'individual',
  storeName: '',
  category: '',
  description: '',
  warehouseAddress: '',
  pickupCity: '',
  pickupArea: '',
  pickupContactPerson: '',
  pickupContactMobile: '',
  cnicNumber: '',
  bannerUpload: null,
  logoUpload: null,
  cnicFrontUpload: null,
  cnicBackUpload: null,
  companyDocumentUpload: null,
};

const fieldLabels: Record<string, string> = {
  sellerType: 'Seller type',
  storeName: 'Store name',
  category: 'Business category',
  description: 'Store description',
  warehouseAddress: 'Warehouse address',
  pickupCity: 'Pickup city',
  pickupArea: 'Pickup area',
  pickupContactPerson: 'Pickup coordinator name',
  pickupContactMobile: 'Pickup coordinator mobile',
  cnicNumber: 'CNIC number',
  bannerUpload: 'Store banner',
  logoUpload: 'Store logo',
  cnicFrontUpload: 'CNIC front',
  cnicBackUpload: 'CNIC back',
  companyDocumentUpload: 'Company registration document',
};

function apiErrorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiError && caught.details && typeof caught.details === 'object') {
    const details = caught.details as {
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };
    const fieldMessages = Object.entries(details.fieldErrors ?? {}).flatMap(
      ([field, messages]) =>
        (messages ?? []).map((message) => `${fieldLabels[field] ?? field}: ${message}`),
    );
    const messages = [...(details.formErrors ?? []), ...fieldMessages];
    if (messages.length) return messages.join(' ');
  }
  return caught instanceof Error ? caught.message : fallback;
}

function documentId(document: UploadedDocument | string | null | undefined) {
  if (!document) return null;
  if (typeof document === 'string') return document;
  return document._id || document.id || null;
}

function documentName(document: UploadedDocument | string | null | undefined) {
  return document && typeof document !== 'string' ? document.originalName : '';
}

function FileField({
  label,
  hint,
  currentName,
  selectedFile,
  onChange,
  required,
}: {
  label: string;
  hint: string;
  currentName?: string;
  selectedFile?: File;
  onChange: (file?: File) => void;
  required?: boolean;
}) {
  return (
    <label className="file-field">
      <span className="file-icon" aria-hidden="true">⇧</span>
      <strong>{label}{required && <span className="required"> *</span>}</strong>
      <span>{selectedFile?.name || currentName || hint}</span>
      <small>JPG, PNG, or PDF · maximum 10 MB</small>
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={(event) => onChange(event.target.files?.[0])}
      />
    </label>
  );
}

export function StoreProfilePage() {
  const [form, setForm] = useState(initialForm);
  const [application, setApplication] = useState<StoreApplication | null>(null);
  const [files, setFiles] = useState<Partial<Record<UploadField, File>>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadApplication() {
      try {
        const result = await apiRequest<{ application: StoreApplication | null }>(
          '/onboarding/me/application',
        );
        const saved = result.application;
        if (saved && ['PENDING_REVIEW', 'APPROVED'].includes(saved.status)) {
          navigate('/onboarding/approval', { replace: true });
          return;
        }
        if (saved) {
          setApplication(saved);
          setForm({
            sellerType: saved.sellerType,
            storeName: saved.storeName,
            category: saved.category,
            description: saved.description,
            warehouseAddress: saved.warehouseAddress,
            pickupCity: saved.pickupCity,
            pickupArea: saved.pickupArea,
            pickupContactPerson: saved.pickupContactPerson,
            pickupContactMobile: saved.pickupContactMobile,
            cnicNumber: saved.cnicNumber,
            bannerUpload: documentId(saved.bannerUpload),
            logoUpload: documentId(saved.logoUpload),
            cnicFrontUpload: documentId(saved.cnicFrontUpload),
            cnicBackUpload: documentId(saved.cnicBackUpload),
            companyDocumentUpload: documentId(saved.companyDocumentUpload),
          });
        }
      } catch (caught) {
        setError(apiErrorMessage(caught, 'Could not load your application.'));
      } finally {
        setLoading(false);
      }
    }
    void loadApplication();
  }, [navigate]);

  function setField<Key extends keyof StoreFormState>(key: Key, value: StoreFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectFile(field: UploadField, file?: File) {
    setFiles((current) => ({ ...current, [field]: file }));
  }

  async function uploadSelectedFiles(nextForm: StoreFormState) {
    const entries = Object.entries(files) as [UploadField, File][];
    for (const [field, file] of entries) {
      if (!file) continue;
      const result = await uploadDocument(file, uploadTypes[field]);
      nextForm[field] = result.document.id || result.document._id || null;
    }
    return nextForm;
  }

  async function saveDraft(shouldSubmit: boolean) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = await uploadSelectedFiles({ ...form });
      const saved = await apiRequest<{ application: StoreApplication }>(
        '/onboarding/me/application/draft',
        { method: 'PUT', body: JSON.stringify(payload) },
      );
      setApplication(saved.application);
      setForm(payload);
      setFiles({});

      if (shouldSubmit) {
        if (!payload.logoUpload || !payload.cnicFrontUpload || !payload.cnicBackUpload) {
          throw new Error('Store logo and both CNIC sides are required before submission.');
        }
        if (payload.sellerType === 'company' && !payload.companyDocumentUpload) {
          throw new Error('Upload a company registration document before submission.');
        }
        await apiRequest('/onboarding/me/application/submit', { method: 'POST' });
        navigate('/onboarding/approval');
      } else {
        setMessage('Draft saved. You can safely return later.');
      }
    } catch (caught) {
      setError(apiErrorMessage(caught, 'The application could not be saved.'));
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void saveDraft(true);
  }

  function textInput(field: keyof StoreFormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setField(field, event.target.value as never);
  }

  return (
    <OnboardingLayout
      step={1}
      eyebrow="National seller onboarding"
      title="Register Your Store / نیا اسٹور رجسٹر کریں"
      description="Complete the merchant profile and verification documents. An administrator will review every submission before plans are unlocked."
    >
      <div className="content-grid registration-grid">
        <form className="form-stack" onSubmit={handleSubmit}>
          {application?.status === 'CHANGES_REQUIRED' && (
            <div className="alert warning">
              <strong>Changes requested by the review team</strong>
              <span>{application.reviewNote}</span>
            </div>
          )}
          {loading && <div className="alert">Loading your saved draft…</div>}
          {error && <div className="alert error" role="alert">{error}</div>}
          {message && <div className="alert success" role="status">{message}</div>}

          <section className="form-card">
            <div className="section-heading">
              <span>
                <small>Visual identity</small>
                <h2>Store Branding &amp; Showcase</h2>
              </span>
              <span className="section-icon">▣</span>
            </div>
            <FileField
              label="Shop Cover Banner"
              hint="Choose a 1200 × 300 px banner"
              currentName={documentName(application?.bannerUpload)}
              selectedFile={files.bannerUpload}
              onChange={(file) => selectFile('bannerUpload', file)}
            />
            <FileField
              label="Merchant Store Logo"
              hint="Choose a square 500 × 500 px logo"
              currentName={documentName(application?.logoUpload)}
              selectedFile={files.logoUpload}
              onChange={(file) => selectFile('logoUpload', file)}
              required
            />
          </section>

          <section className="form-card">
            <div className="section-heading">
              <span>
                <small>Account classification</small>
                <h2>Seller Business Type / کاروبار کی قسم</h2>
              </span>
              <span className="section-icon">◇</span>
            </div>
            <div className="choice-grid">
              <label className={`choice-card ${form.sellerType === 'individual' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="sellerType"
                  value="individual"
                  checked={form.sellerType === 'individual'}
                  onChange={() => setField('sellerType', 'individual')}
                />
                <strong>Individual Seller</strong>
                <span>For sole proprietors and home-based businesses using a personal CNIC.</span>
              </label>
              <label className={`choice-card ${form.sellerType === 'company' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="sellerType"
                  value="company"
                  checked={form.sellerType === 'company'}
                  onChange={() => setField('sellerType', 'company')}
                />
                <strong>Company / Brand</strong>
                <span>For registered companies, partnerships, and incorporated brands.</span>
              </label>
            </div>
          </section>

          <section className="form-card">
            <div className="section-heading">
              <span>
                <small>Store details</small>
                <h2>Store Information &amp; Category</h2>
              </span>
              <span className="section-icon">▤</span>
            </div>
            <div className="field-grid">
              <label className="field full">
                <span>Official Store Name *</span>
                <input value={form.storeName} onChange={textInput('storeName')} required minLength={2} maxLength={100} placeholder="e.g. Al-Madina Electronics" />
              </label>
              <label className="field full">
                <span>Primary Business Category *</span>
                <select value={form.category} onChange={textInput('category')} required>
                  <option value="">Select a category…</option>
                  <option value="fashion">Fashion &amp; Apparel</option>
                  <option value="electronics">Mobiles &amp; Electronics</option>
                  <option value="beauty">Health &amp; Beauty</option>
                  <option value="home">Home &amp; Living</option>
                  <option value="groceries">Groceries &amp; Gourmet</option>
                  <option value="automotive">Automotive &amp; Spares</option>
                  <option value="books">Books &amp; Stationery</option>
                </select>
              </label>
              <label className="field full">
                <span>Store Description &amp; Bio *</span>
                <textarea
                  value={form.description}
                  onChange={textInput('description')}
                  required
                  minLength={20}
                  maxLength={400}
                  rows={5}
                  placeholder="Describe your product lines, origin city, warranty commitments, and brand history…"
                />
                <small>{form.description.length} / 400</small>
              </label>
              {form.sellerType === 'company' && (
                <div className="full">
                  <FileField
                    label="Company / Brand Registration Document"
                    hint="SECP incorporation, NTN certificate, partnership deed, or trademark letter"
                    currentName={documentName(application?.companyDocumentUpload)}
                    selectedFile={files.companyDocumentUpload}
                    onChange={(file) => selectFile('companyDocumentUpload', file)}
                    required
                  />
                </div>
              )}
            </div>
          </section>

          <section className="form-card">
            <div className="section-heading">
              <span>
                <small>Logistics &amp; dispatch location</small>
                <h2>Business &amp; Pickup Address</h2>
              </span>
              <span className="section-icon">⌖</span>
            </div>
            <div className="field-grid">
              <label className="field full">
                <span>Warehouse / Shop Street Address *</span>
                <input value={form.warehouseAddress} onChange={textInput('warehouseAddress')} required minLength={8} maxLength={250} placeholder="Shop number, floor, building, and street" />
              </label>
              <label className="field">
                <span>City *</span>
                <select value={form.pickupCity} onChange={textInput('pickupCity')} required>
                  <option value="">Select dispatch city…</option>
                  {['Karachi', 'Lahore', 'Rawalpindi', 'Islamabad', 'Faisalabad', 'Multan', 'Peshawar', 'Sialkot', 'Gujranwala', 'Quetta', 'Other'].map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Area / Town / Sector *</span>
                <input value={form.pickupArea} onChange={textInput('pickupArea')} required minLength={2} maxLength={100} placeholder="e.g. Gulberg III" />
              </label>
              <label className="field">
                <span>Pickup Coordinator Name *</span>
                <input value={form.pickupContactPerson} onChange={textInput('pickupContactPerson')} required minLength={2} maxLength={100} placeholder="Focal person at the warehouse" />
              </label>
              <label className="field">
                <span>Pickup Coordinator Mobile *</span>
                <input value={form.pickupContactMobile} onChange={textInput('pickupContactMobile')} required minLength={10} maxLength={20} type="tel" placeholder="0300 9876543" />
              </label>
            </div>
          </section>

          <section className="form-card">
            <div className="section-heading">
              <span>
                <small>Identity verification</small>
                <h2>National ID / CNIC</h2>
              </span>
              <span className="section-icon">✓</span>
            </div>
            <label className="field">
              <span>CNIC Number *</span>
              <input
                value={form.cnicNumber}
                onChange={textInput('cnicNumber')}
                required
                placeholder="42101-1234567-1"
                maxLength={15}
                pattern="[0-9]{5}-?[0-9]{7}-?[0-9]"
                title="Enter 13 CNIC digits, with or without hyphens (for example 42101-1234567-1)."
                inputMode="numeric"
              />
            </label>
            <div className="file-grid">
              <FileField
                label="CNIC Front Side"
                hint="Choose the front image"
                currentName={documentName(application?.cnicFrontUpload)}
                selectedFile={files.cnicFrontUpload}
                onChange={(file) => selectFile('cnicFrontUpload', file)}
                required
              />
              <FileField
                label="CNIC Back Side"
                hint="Choose the back image"
                currentName={documentName(application?.cnicBackUpload)}
                selectedFile={files.cnicBackUpload}
                onChange={(file) => selectFile('cnicBackUpload', file)}
                required
              />
            </div>
            <div className="privacy-note">
              Identity documents are visible only to authorized reviewers. Local file storage is for development only.
            </div>
          </section>

          <section className="form-actions-card">
            <label className="consent-row">
              <input type="checkbox" required />
              <span>I confirm that the submitted business and identity information is accurate and may be manually reviewed by Foran.pk.</span>
            </label>
            <div className="button-row">
              <button className="secondary-button" type="button" disabled={busy} onClick={() => void saveDraft(false)}>
                Save Draft
              </button>
              <button className="primary-button" type="submit" disabled={busy || loading}>
                {busy ? 'Saving…' : application?.status === 'CHANGES_REQUIRED' ? 'Save & Resubmit for Approval' : 'Submit for Approval'}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        </form>

        <aside className="side-stack">
          <div className="info-card accent-card">
            <span className="info-icon">%</span>
            <small>Zero upfront cost</small>
            <h3>0% Store Listing Fee</h3>
            <p>Complete the profile and wait for manual verification before selecting a plan.</p>
          </div>
          <div className="info-card">
            <h3>Manual approval checklist</h3>
            <ul className="check-list">
              <li>Valid Pakistani CNIC</li>
              <li>Complete pickup address</li>
              <li>Clear identity documents</li>
              <li>Company registration when applicable</li>
            </ul>
          </div>
          <div className="info-card support-card">
            <small>Seller Support Desk</small>
            <h3>Need help?</h3>
            <p>Contact the onboarding team for document or category questions.</p>
            <a href="mailto:seller-support@foran.pk">seller-support@foran.pk</a>
          </div>
        </aside>
      </div>
    </OnboardingLayout>
  );
}
