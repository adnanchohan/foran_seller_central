import type { StoreApplication } from "@foran/contracts";

interface ApprovalPageProps {
  application: StoreApplication | null;
  onNavigate: (path: string) => void;
  onRefresh: () => Promise<void>;
}

export function ApprovalPage({ application, onNavigate, onRefresh }: ApprovalPageProps) {
  const status = application?.status || "DRAFT";

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 20px" }}>
      <div className="page-heading">
        <span className="eyebrow">Onboarding Step 2</span>
        <h1>Account & Document Verification</h1>
      </div>

      <div className="form-card" style={{ textAlign: "center", padding: "40px 30px" }}>
        {status === "DRAFT" && (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h2>Application Not Submitted Yet</h2>
            <p style={{ color: "var(--muted)", margin: "14px 0 24px" }}>
              Please complete your store details and upload verification documents to submit for
              review.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => onNavigate("/onboarding/store")}
            >
              Complete Store Profile
            </button>
          </div>
        )}

        {status === "PENDING_REVIEW" && (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2>Verification Under Review</h2>
            <p style={{ color: "var(--muted)", margin: "14px 0 24px" }}>
              Our compliance team is verifying your CNIC and store registration details. Reviews
              typically take between 2 to 24 hours.
            </p>
            <div className="alert warning" style={{ textAlign: "left", marginBottom: 20 }}>
              <strong>Application Status: PENDING REVIEW</strong>
              <span>Submitted for: {application?.storeName || "Your Store"}</span>
            </div>
            <button type="button" className="secondary-button" onClick={() => onRefresh()}>
              Refresh Status
            </button>
          </div>
        )}

        {status === "CHANGES_REQUIRED" && (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2>Changes Requested by Reviewer</h2>
            <div className="alert error" style={{ textAlign: "left", margin: "18px 0 24px" }}>
              <strong>Feedback from Compliance Officer:</strong>
              <p style={{ margin: "6px 0 0" }}>{application?.reviewNote}</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => onNavigate("/onboarding/store")}
            >
              Update Store Profile
            </button>
          </div>
        )}

        {status === "APPROVED" && (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2>Store Application Approved!</h2>
            <p style={{ color: "var(--muted)", margin: "14px 0 24px" }}>
              Congratulations! Your store <strong>{application?.storeName}</strong> has been
              verified and approved by the Foran.pk team.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => onNavigate("/onboarding/plans")}
            >
              Proceed to Plan Selection →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
