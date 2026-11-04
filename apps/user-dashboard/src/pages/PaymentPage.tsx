import { useState } from "react";
import { PLAN_PRICING } from "@foran/config";
import type { User } from "@foran/contracts";
import { completePlaceholderPayment } from "../api.js";

interface PaymentPageProps {
  user: User | null;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function PaymentPage({ user, onRefresh, onNavigate }: PaymentPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = user?.plan || "PREMIUM";
  const pricing = PLAN_PRICING[plan];

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      await completePlaceholderPayment();
      await onRefresh();
      onNavigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 650, margin: "40px auto", padding: "0 20px" }}>
      <div className="page-heading">
        <span className="eyebrow">Onboarding Step 4</span>
        <h1>Store Placement & Activation</h1>
        <p>
          Complete your store setup fee to activate your seller portal and inventory management.
        </p>
      </div>

      {error && (
        <div className="alert error" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="form-card" style={{ padding: 32 }}>
        <div className="section-heading">
          <span>
            <small>Summary</small>
            <h2>Placement Fee Order</h2>
          </span>
          <span style={{ fontSize: 22 }}>💳</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px 0",
            borderBottom: "1px solid var(--surface-high)",
            fontSize: 14,
          }}
        >
          <span>Selected Plan:</span>
          <strong>{pricing.label} Seller</strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px 0",
            borderBottom: "1px solid var(--surface-high)",
            fontSize: 18,
          }}
        >
          <span>Total Payable:</span>
          <strong style={{ color: "var(--primary)" }}>PKR {pricing.amount.toLocaleString()}</strong>
        </div>

        <div className="alert warning" style={{ margin: "24px 0" }}>
          <strong>Development Mode Simulator</strong>
          <span>
            This is a mock payment step. No real money will be charged. Clicking below creates an
            activation record and unlocks your dashboard.
          </span>
        </div>

        <button
          type="button"
          className="primary-button wide"
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? "Activating Store..." : "Simulate Activation Payment & Open Dashboard"}
        </button>
      </div>
    </div>
  );
}
