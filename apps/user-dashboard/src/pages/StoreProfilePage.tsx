import { useState } from "react";
import type { StoreApplication } from "@foran/contracts";
import { saveApplicationDraft, submitApplication, uploadDocument } from "../api.js";

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
  const [logoId, setLogoId] = useState(application?.logoUploadId || "");
  const [cnicFrontId, setCnicFrontId] = useState(application?.cnicFrontUploadId || "");
  const [cnicBackId, setCnicBackId] = useState(application?.cnicBackUploadId || "");

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleFileUpload = async (file: File, docType: string, setter: (id: string) => void) => {
    try {
      const doc = await uploadDocument(file, docType);
      setter(doc.id);
      setMessage({ text: `${file.name} uploaded successfully!`, type: "success" });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to upload file",
        type: "error",
      });
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
    <div style={{ maxWidth: 900, margin: "30px auto", padding: "0 20px" }}>
      <div className="page-heading">
        <span className="eyebrow">Onboarding Step 1</span>
        <h1>Store Profile & Documents</h1>
        <p>
          Fill in your store details, pickup warehouse information, and government identity
          verification documents.
        </p>
      </div>

      {message && (
        <div className={`alert ${message.type}`} role="alert" style={{ marginBottom: 20 }}>
          {message.text}
        </div>
      )}

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
              placeholder="e.g. Gulberg, DHA, F-7"
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
            <h2>CNIC & Branding Documents</h2>
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
            <span>Store Logo (PNG / JPG) *</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f, "store-logo", setLogoId);
              }}
            />
            {logoId && <small style={{ color: "var(--success)" }}>✓ Logo uploaded</small>}
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
  );
}
