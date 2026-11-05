import { useState } from "react";
import type { StoreApplication } from "@foran/contracts";
import {
  getUploadViewUrl,
  saveApplicationDraft,
  submitApplication,
  uploadDocument,
} from "../api.js";

interface StoreProfilePageProps {
  application: StoreApplication | null;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function StoreProfilePage({ application, onRefresh, onNavigate }: StoreProfilePageProps) {
  const [storeName, setStoreName] = useState(application?.storeName || "");
  const [category, setCategory] = useState(application?.category || "");
  const [description, setDescription] = useState(application?.description || "");
  const [warehouseAddress, setWarehouseAddress] = useState(application?.warehouseAddress || "");
  const [pickupCity, setPickupCity] = useState(application?.pickupCity || "");
  const [pickupArea, setPickupArea] = useState(application?.pickupArea || "");
  const [pickupContactPerson, setPickupContactPerson] = useState(
    application?.pickupContactPerson || "",
  );
  const [pickupContactMobile, setPickupContactMobile] = useState(
    application?.pickupContactMobile || "",
  );
  const [cnicNumber, setCnicNumber] = useState(application?.cnicNumber || "");
  const [bannerId, setBannerId] = useState(application?.bannerUploadId || "");
  const [logoId, setLogoId] = useState(application?.logoUploadId || "");
  const [cnicFrontId, setCnicFrontId] = useState(application?.cnicFrontUploadId || "");
  const [cnicBackId, setCnicBackId] = useState(application?.cnicBackUploadId || "");

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleFileUpload = async (
    file: File,
    docType: string,
    setter: (id: string) => void,
    setLoading?: (l: boolean) => void,
  ) => {
    try {
      setLoading?.(true);
      const doc = await uploadDocument(file, docType);
      setter(doc.id);
      setMessage({ text: `${file.name} uploaded successfully!`, type: "success" });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to upload file",
        type: "error",
      });
    } finally {
      setLoading?.(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveApplicationDraft({
        storeName,
        category,
        description,
        warehouseAddress,
        pickupCity,
        pickupArea,
        pickupContactPerson,
        pickupContactMobile,
        cnicNumber,
        bannerUploadId: bannerId || null,
        logoUploadId: logoId || null,
        cnicFrontUploadId: cnicFrontId || null,
        cnicBackUploadId: cnicBackId || null,
      });
      await onRefresh();
      setMessage({ text: "Draft saved successfully!", type: "success" });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to save draft",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoId) {
      setMessage({
        text: "Please upload a Merchant Store Logo in the Visual Identity section before submitting.",
        type: "error",
      });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await saveApplicationDraft({
        storeName,
        category,
        description,
        warehouseAddress,
        pickupCity,
        pickupArea,
        pickupContactPerson,
        pickupContactMobile,
        cnicNumber,
        bannerUploadId: bannerId || null,
        logoUploadId: logoId || null,
        cnicFrontUploadId: cnicFrontId || null,
        cnicBackUploadId: cnicBackId || null,
      });
      await submitApplication();
      await onRefresh();
      onNavigate("/onboarding/approval");
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Submission failed",
        type: "error",
      });
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: 24 }}>
      {/* Main 2-Column Registration Grid */}
      <div className="content-grid registration-grid">
        {/* Left Column: Visual Identity & Store Details */}
        <div className="form-stack">
          {message && (
            <div className={`alert ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          {/* Card 1: VISUAL IDENTITY */}
          <div className="visual-identity-card">
            <div className="card-header-row">
              <div>
                <span className="card-overline">VISUAL IDENTITY</span>
                <h2 className="card-title">Store Branding &amp; Showcase</h2>
              </div>
              <div className="card-header-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
            </div>

            {/* Shop Cover Banner Section */}
            <div className="banner-section">
              <div className="section-label-row">
                <span className="section-label-title">Shop Cover Banner</span>
                <span className="section-label-hint">Recommended: 1200 × 300px (PNG, JPG)</span>
              </div>

              <div
                className="banner-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileUpload(f, "store-banner", setBannerId, setUploadingBanner);
                }}
              >
                <input
                  type="file"
                  id="banner-file-input"
                  accept="image/png,image/jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "store-banner", setBannerId, setUploadingBanner);
                  }}
                />

                {bannerId ? (
                  <div className="banner-preview-wrapper">
                    <img
                      src={getUploadViewUrl(bannerId)}
                      alt="Store Cover Banner"
                      className="banner-preview-img"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="banner-preview-actions">
                      <button
                        type="button"
                        className="banner-action-btn"
                        onClick={() => document.getElementById("banner-file-input")?.click()}
                        disabled={uploadingBanner}
                      >
                        {uploadingBanner ? "Uploading..." : "Change Banner"}
                      </button>
                      <button
                        type="button"
                        className="banner-action-btn danger"
                        onClick={() => setBannerId("")}
                        disabled={uploadingBanner}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="banner-dropzone-content">
                    <div className="banner-icon-badge">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <p className="banner-dropzone-prompt">
                      Drag and drop banner photo or{" "}
                      <button
                        type="button"
                        className="browse-link-btn"
                        onClick={() => document.getElementById("banner-file-input")?.click()}
                        disabled={uploadingBanner}
                      >
                        {uploadingBanner ? "Uploading..." : "Browse"}
                      </button>
                    </p>
                    <span className="banner-dropzone-subtitle">
                      High-resolution banner boosts store conversions by 28%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Merchant Store Logo Section */}
            <div className="logo-section">
              <div className="logo-avatar-box">
                {logoId ? (
                  <img
                    src={getUploadViewUrl(logoId)}
                    alt="Merchant Store Logo"
                    className="logo-avatar-img"
                  />
                ) : (
                  <div className="logo-placeholder-graphic">
                    <svg
                      width="38"
                      height="38"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#5c3ea8"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </div>
                )}
                <label
                  htmlFor="logo-file-input"
                  className="logo-upload-badge"
                  title="Upload store logo"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </label>
                <input
                  type="file"
                  id="logo-file-input"
                  accept="image/png,image/jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "store-logo", setLogoId, setUploadingLogo);
                  }}
                />
              </div>

              <div className="logo-details">
                <h3 className="logo-title">Merchant Store Logo</h3>
                <p className="logo-subtitle">
                  Square format (500 × 500 px). Displayed on mobile app searches, product parcels,
                  and tax receipts.
                </p>
                <div className="logo-actions">
                  <button
                    type="button"
                    className="upload-logo-btn"
                    onClick={() => document.getElementById("logo-file-input")?.click()}
                    disabled={uploadingLogo}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                  </button>
                  {logoId && (
                    <button
                      type="button"
                      className="remove-logo-btn"
                      onClick={() => setLogoId("")}
                      disabled={uploadingLogo}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Store Details Form */}
          <form onSubmit={handleSubmit} className="form-card">
            <div className="section-heading">
              <span>
                <small>Store Details</small>
                <h2>General Information</h2>
              </span>
            </div>

            <div className="field-grid">
              <div className="field">
                <span>Store Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Traders"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Category *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Groceries, Electronics"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="field full">
                <span>Store Description *</span>
                <textarea
                  required
                  rows={3}
                  placeholder="Brief description of your products and store (minimum 20 characters)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="section-heading" style={{ marginTop: 30 }}>
              <span>
                <small>Logistics & Pickup</small>
                <h2>Warehouse Details</h2>
              </span>
            </div>

            <div className="field-grid">
              <div className="field full">
                <span>Warehouse Address *</span>
                <input
                  type="text"
                  required
                  placeholder="Street address, building name, plot number"
                  value={warehouseAddress}
                  onChange={(e) => setWarehouseAddress(e.target.value)}
                />
              </div>

              <div className="field">
                <span>City *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Area / Sector *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. DHA, Gulberg, F-7"
                  value={pickupArea}
                  onChange={(e) => setPickupArea(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Contact Person *</span>
                <input
                  type="text"
                  required
                  placeholder="Full name of pickup coordinator"
                  value={pickupContactPerson}
                  onChange={(e) => setPickupContactPerson(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Contact Mobile *</span>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +923001234567"
                  value={pickupContactMobile}
                  onChange={(e) => setPickupContactMobile(e.target.value)}
                />
              </div>
            </div>

            <div className="section-heading" style={{ marginTop: 30 }}>
              <span>
                <small>Legal Verification</small>
                <h2>CNIC Verification</h2>
              </span>
            </div>

            <div className="field-grid">
              <div className="field full">
                <span>CNIC Number *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. 35201-1234567-1"
                  value={cnicNumber}
                  onChange={(e) => setCnicNumber(e.target.value)}
                />
              </div>

              <div className="field">
                <span>CNIC Front Side *</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "cnic-front", setCnicFrontId);
                  }}
                />
                {cnicFrontId && <small style={{ color: "var(--success)" }}>✓ Front uploaded</small>}
              </div>

              <div className="field">
                <span>CNIC Back Side *</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "cnic-back", setCnicBackId);
                  }}
                />
                {cnicBackId && <small style={{ color: "var(--success)" }}>✓ Back uploaded</small>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 30, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button type="submit" className="primary-button" disabled={saving || submitting}>
                {submitting ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Sidebar Cards */}
        <aside className="side-stack">
          {/* Sidebar Card 1: ZERO UPFRONT COST */}
          <div className="zero-upfront-card">
            <div className="zero-upfront-badge">
              <span>%</span>
            </div>
            <div>
              <span className="zero-upfront-overline">ZERO UPFRONT COST</span>
              <h3 className="zero-upfront-title">0% Store Listing Fee</h3>
            </div>
            <p className="zero-upfront-desc">
              Start completely free. Pay nominal commission only when your orders successfully ship
              and reach buyers in 250+ cities across Pakistan.
            </p>
          </div>

          {/* Sidebar Card 2: Required for Next Steps */}
          <div className="required-steps-card">
            <div className="required-steps-header">
              <h3 className="required-steps-title">Required for Next Steps</h3>
              <div className="required-steps-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
            </div>
            <p className="required-steps-sub">
              Keep these documents ready for Step 2 and Step 3 fast-track approval:
            </p>
            <ul className="required-steps-list">
              <li>
                <span className="list-check-icon">✓</span>
                <span>
                  Valid Pakistan CNIC (National Identity Card) front &amp; back photograph
                </span>
              </li>
              <li>
                <span className="list-check-icon">✓</span>
                <span>Active Pakistani IBAN Bank Account for direct weekly sales disbursement</span>
              </li>
              <li>
                <span className="list-check-icon">✓</span>
                <span>NTN (National Tax Number) certificate if registering as Corporate/SME</span>
              </li>
            </ul>
            <div className="approval-time-banner">
              <span className="bolt-icon">⚡</span>
              <span>
                Average shop approval time: <strong>Within 4 Hours</strong>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
