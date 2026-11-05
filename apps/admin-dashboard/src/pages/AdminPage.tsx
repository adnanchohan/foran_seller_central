import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@foran/config";
import type { StoreApplication } from "@foran/contracts";
import {
  deleteApplication,
  downloadDocument,
  getDocumentViewUrl,
  listApplications,
  reviewApplication,
} from "../api.js";

function formatDateTime(timestamp?: number | null) {
  if (!timestamp) return "Draft / Unsubmitted";
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPage() {
  const [filter, setFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [applications, setApplications] = useState<StoreApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<StoreApplication | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const status = filter === "ALL" ? undefined : filter;
      const list = await listApplications(status);
      setApplications(list);
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to load applications",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleDecision = async (decision: "APPROVE" | "REQUEST_CHANGES") => {
    if (!selectedApp) return;
    if (decision === "REQUEST_CHANGES" && reviewNote.trim().length < 5) {
      setMessage({
        text: "Please provide a detailed note explaining what needs changes (minimum 5 chars).",
        type: "error",
      });
      return;
    }

    setActing(true);
    setMessage(null);
    try {
      const updated = await reviewApplication(selectedApp.id, decision, reviewNote);
      setSelectedApp(updated);
      setMessage({
        text: `Application marked as ${decision === "APPROVE" ? "APPROVED" : "CHANGES REQUIRED"}!`,
        type: "success",
      });
      setReviewNote("");
      loadData();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Review submission failed",
        type: "error",
      });
    } finally {
      setActing(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!selectedApp) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await deleteApplication(selectedApp.id);
      setMessage({
        text: res.message || `Store "${selectedApp.storeName}" was permanently wiped out.`,
        type: "success",
      });
      setSelectedApp(null);
      setConfirmDelete(false);
      await loadData();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to delete store from database",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "30px auto", padding: "0 20px" }}>
      <div className="page-heading">
        <span className="eyebrow" style={{ color: "var(--error)" }}>
          Verification Queue
        </span>
        <h1>Seller Application Reviews</h1>
        <p>
          Review store profiles, verify CNIC documents, and issue approvals or changes required.
        </p>
      </div>

      {message && (
        <div className={`alert ${message.type}`} role="alert" style={{ marginBottom: 20 }}>
          {message.text}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {(["ALL", "PENDING_REVIEW", "CHANGES_REQUIRED", "APPROVED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={filter === s ? "primary-button" : "secondary-button"}
            onClick={() => setFilter(s)}
            style={{ fontSize: 12, padding: "8px 16px", minHeight: 36 }}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: 24 }}>
        {/* Applications List */}
        <div className="form-card" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px" }}>Submitted Applications ({applications.length})</h3>

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Loading queue...</p>
          ) : applications.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No applications found matching filter.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app);
                    setConfirmDelete(false);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border:
                      selectedApp?.id === app.id
                        ? "2px solid var(--primary)"
                        : "1px solid var(--surface-high)",
                    background: selectedApp?.id === app.id ? "var(--primary-softer)" : "white",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <strong style={{ fontSize: 15 }}>{app.storeName || "Unnamed Store"}</strong>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          app.status === "APPROVED"
                            ? "var(--success-soft)"
                            : app.status === "PENDING_REVIEW"
                              ? "var(--warning-soft)"
                              : "var(--error-soft)",
                        color:
                          app.status === "APPROVED"
                            ? "var(--success)"
                            : app.status === "PENDING_REVIEW"
                              ? "var(--warning)"
                              : "var(--error)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Applicant Name & Email */}
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    👤{" "}
                    <strong>
                      {app.user?.displayName || app.pickupContactPerson || "Applicant"}
                    </strong>
                    <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                      ({app.user?.email || "No email"})
                    </span>
                  </div>

                  {/* Submission Date Time */}
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    🕒 <strong>Submitted:</strong>{" "}
                    {formatDateTime(app.submittedAt || app.createdAt)}
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Category: {app.category || "General"} • City: {app.pickupCity || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Application Review Panel */}
        <div className="form-card" style={{ padding: 24 }}>
          {selectedApp ? (
            <div>
              {/* Store Title Section with Brand Logo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--border)",
                  marginBottom: 16,
                }}
              >
                {selectedApp.logoUploadId ? (
                  <img
                    src={getDocumentViewUrl(selectedApp.logoUploadId)}
                    alt={selectedApp.storeName}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      objectFit: "cover",
                      border: "1px solid var(--border)",
                      background: "#f8fafc",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      flexShrink: 0,
                    }}
                  >
                    🏪
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <small
                    style={{
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    Review Details
                  </small>
                  <h2 style={{ margin: "2px 0 4px", fontSize: 22, wordBreak: "break-word" }}>
                    {selectedApp.storeName}
                  </h2>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="language-pill" style={{ textTransform: "capitalize" }}>
                      {selectedApp.sellerType}
                    </span>
                    <code style={{ fontSize: 12, color: "var(--muted)" }}>
                      /{selectedApp.storeSlug}
                    </code>
                  </div>
                </div>
              </div>

              {/* All Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
                {/* Applicant Info Box */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "12px 14px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>Applicant Name</span>
                    <div style={{ fontWeight: 600 }}>
                      {selectedApp.user?.displayName ||
                        selectedApp.pickupContactPerson ||
                        "Not provided"}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>Applicant Email</span>
                    <div style={{ fontWeight: 600 }}>{selectedApp.user?.email || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>
                      Submission Date & Time
                    </span>
                    <div>{formatDateTime(selectedApp.submittedAt || selectedApp.createdAt)}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>Applicant User ID</span>
                    <div style={{ fontFamily: "monospace", fontSize: 11 }}>
                      {selectedApp.userId}
                    </div>
                  </div>
                </div>

                <div>
                  <strong>Category:</strong> {selectedApp.category || "Not specified"}
                </div>
                <div>
                  <strong>CNIC Number:</strong> {selectedApp.cnicNumber || "Not provided"}
                </div>
                <div>
                  <strong>Description:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", lineHeight: 1.5 }}>
                    {selectedApp.description || "No description provided."}
                  </p>
                </div>
                <div>
                  <strong>Pickup Warehouse:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                    {selectedApp.warehouseAddress || "N/A"}, {selectedApp.pickupArea || ""},{" "}
                    {selectedApp.pickupCity || ""}
                  </p>
                </div>
                <div>
                  <strong>Coordinator:</strong> {selectedApp.pickupContactPerson} (
                  {selectedApp.pickupContactMobile})
                </div>

                {/* Uploaded Verification Files */}
                <div style={{ marginTop: 10 }}>
                  <strong style={{ fontSize: 14 }}>Uploaded Verification Files:</strong>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginTop: 10,
                    }}
                  >
                    {/* CNIC Front */}
                    {selectedApp.cnicFrontUploadId && (
                      <div
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 10,
                          background: "#fbfcfe",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 12 }}>CNIC Front</span>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ fontSize: 10, padding: "3px 8px", minHeight: 24 }}
                            onClick={() =>
                              downloadDocument(selectedApp.cnicFrontUploadId!, "cnic_front.png")
                            }
                          >
                            Download
                          </button>
                        </div>
                        <a
                          href={getDocumentViewUrl(selectedApp.cnicFrontUploadId)}
                          target="_blank"
                          rel="noreferrer"
                          title="Click to view full image"
                        >
                          <img
                            src={getDocumentViewUrl(selectedApp.cnicFrontUploadId)}
                            alt="CNIC Front"
                            style={{
                              width: "100%",
                              height: 140,
                              objectFit: "contain",
                              borderRadius: 6,
                              background: "white",
                              border: "1px solid var(--border)",
                            }}
                          />
                        </a>
                      </div>
                    )}

                    {/* CNIC Back */}
                    {selectedApp.cnicBackUploadId && (
                      <div
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 10,
                          background: "#fbfcfe",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 12 }}>CNIC Back</span>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ fontSize: 10, padding: "3px 8px", minHeight: 24 }}
                            onClick={() =>
                              downloadDocument(selectedApp.cnicBackUploadId!, "cnic_back.png")
                            }
                          >
                            Download
                          </button>
                        </div>
                        <a
                          href={getDocumentViewUrl(selectedApp.cnicBackUploadId)}
                          target="_blank"
                          rel="noreferrer"
                          title="Click to view full image"
                        >
                          <img
                            src={getDocumentViewUrl(selectedApp.cnicBackUploadId)}
                            alt="CNIC Back"
                            style={{
                              width: "100%",
                              height: 140,
                              objectFit: "contain",
                              borderRadius: 6,
                              background: "white",
                              border: "1px solid var(--border)",
                            }}
                          />
                        </a>
                      </div>
                    )}

                    {/* Company Document if any */}
                    {selectedApp.companyDocumentUploadId && (
                      <div
                        style={{
                          gridColumn: "span 2",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 10,
                          background: "#fbfcfe",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>
                            Company Registration / NTN
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a
                            href={getDocumentViewUrl(selectedApp.companyDocumentUploadId)}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-button"
                            style={{
                              fontSize: 11,
                              padding: "4px 10px",
                              minHeight: 26,
                              textDecoration: "none",
                            }}
                          >
                            View Document
                          </a>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ fontSize: 11, padding: "4px 10px", minHeight: 26 }}
                            onClick={() =>
                              downloadDocument(
                                selectedApp.companyDocumentUploadId!,
                                "company_doc.pdf",
                              )
                            }
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Store Banner if any */}
                    {selectedApp.bannerUploadId && (
                      <div
                        style={{
                          gridColumn: "span 2",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 10,
                          background: "#fbfcfe",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 12 }}>Store Banner</span>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ fontSize: 10, padding: "3px 8px", minHeight: 24 }}
                            onClick={() =>
                              downloadDocument(selectedApp.bannerUploadId!, "store_banner.png")
                            }
                          >
                            Download
                          </button>
                        </div>
                        <img
                          src={getDocumentViewUrl(selectedApp.bannerUploadId)}
                          alt="Store Banner"
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Reviewer Action Buttons */}
                {selectedApp.status === "PENDING_REVIEW" && (
                  <div style={{ marginTop: 16 }}>
                    <div className="field">
                      <span>Reviewer Feedback Note</span>
                      <textarea
                        rows={3}
                        placeholder="Required when requesting changes from seller..."
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDecision("REQUEST_CHANGES")}
                        disabled={acting}
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleDecision("APPROVE")}
                        disabled={acting}
                      >
                        Approve Store
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete / Wipe Out Store Section */}
                <div
                  style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}
                >
                  {confirmDelete ? (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        background: "var(--error-soft)",
                        border: "1px solid var(--error)",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "var(--error)", marginBottom: 6 }}>
                        ⚠️ Confirm Permanent Store Deletion
                      </div>
                      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text)" }}>
                        Are you sure you want to permanently wipe out{" "}
                        <strong>{selectedApp.storeName}</strong> from the database? All verification
                        documents and application history will be permanently deleted.
                      </p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={handleDeleteStore}
                          disabled={deleting}
                          style={{ flex: 1 }}
                        >
                          {deleting ? "Wiping out..." : "Yes, Delete & Wipe Out Store"}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setConfirmDelete(false)}
                          disabled={deleting}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirmDelete(true)}
                      style={{
                        width: "100%",
                        color: "var(--error)",
                        borderColor: "var(--error-soft)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      🗑️ Wipe Out Store from DB
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--muted)", textAlign: "center", margin: "40px 0" }}>
              Select an application from the queue to inspect and review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
