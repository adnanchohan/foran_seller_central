import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@foran/config";
import type { StoreApplication } from "@foran/contracts";
import { downloadDocument, listApplications, reviewApplication } from "../api.js";

export function AdminPage() {
  const [filter, setFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [applications, setApplications] = useState<StoreApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<StoreApplication | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
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

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
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
                  onClick={() => setSelectedApp(app)}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border:
                      selectedApp?.id === app.id
                        ? "2px solid var(--primary)"
                        : "1px solid var(--surface-high)",
                    background: selectedApp?.id === app.id ? "var(--primary-softer)" : "white",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>{app.storeName || "Unnamed Store"}</strong>
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
                      }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                    Category: {app.category} • City: {app.pickupCity}
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
              <div className="section-heading">
                <span>
                  <small>Review Details</small>
                  <h2>{selectedApp.storeName}</h2>
                </span>
                <span className="language-pill">{selectedApp.sellerType}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div>
                  <strong>CNIC Number:</strong> {selectedApp.cnicNumber}
                </div>
                <div>
                  <strong>Description:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                    {selectedApp.description}
                  </p>
                </div>
                <div>
                  <strong>Pickup Warehouse:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                    {selectedApp.warehouseAddress}, {selectedApp.pickupArea},{" "}
                    {selectedApp.pickupCity}
                  </p>
                </div>
                <div>
                  <strong>Coordinator:</strong> {selectedApp.pickupContactPerson} (
                  {selectedApp.pickupContactMobile})
                </div>

                <div style={{ marginTop: 16 }}>
                  <strong>Uploaded Verification Files:</strong>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {selectedApp.logoUploadId && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: 11, padding: "6px 10px", minHeight: 30 }}
                        onClick={() => downloadDocument(selectedApp.logoUploadId!, "logo.png")}
                      >
                        Download Logo
                      </button>
                    )}
                    {selectedApp.cnicFrontUploadId && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: 11, padding: "6px 10px", minHeight: 30 }}
                        onClick={() =>
                          downloadDocument(selectedApp.cnicFrontUploadId!, "cnic_front.png")
                        }
                      >
                        Download CNIC Front
                      </button>
                    )}
                    {selectedApp.cnicBackUploadId && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: 11, padding: "6px 10px", minHeight: 30 }}
                        onClick={() =>
                          downloadDocument(selectedApp.cnicBackUploadId!, "cnic_back.png")
                        }
                      >
                        Download CNIC Back
                      </button>
                    )}
                  </div>
                </div>

                {selectedApp.status === "PENDING_REVIEW" && (
                  <div style={{ marginTop: 20 }}>
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
