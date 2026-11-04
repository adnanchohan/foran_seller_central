import { useState } from "react";
import type { SellerPlan, User } from "@foran/contracts";
import { selectPlan } from "../api.js";

interface PlansPageProps {
  user: User | null;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function PlansPage({ user, onRefresh, onNavigate }: PlansPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<SellerPlan>(user?.plan || "PREMIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (plan: SellerPlan) => {
    setSelectedPlan(plan);
    setLoading(true);
    setError(null);
    try {
      await selectPlan(plan);
      await onRefresh();
      onNavigate("/onboarding/payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: "30px auto", padding: "0 20px" }}>
      <div className="page-heading">
        <span className="eyebrow">Onboarding Step 3</span>
        <h1>Choose Your Seller Plan</h1>
        <p>Select the subscription plan that fits your business scale and catalog size.</p>
      </div>

      {error && (
        <div className="alert error" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* BASIC PLAN */}
        <div
          className="form-card"
          style={{
            padding: 30,
            border: selectedPlan === "BASIC" ? "2px solid var(--primary)" : undefined,
            position: "relative",
          }}
        >
          <span className="eyebrow">Starter Tier</span>
          <h2 style={{ fontSize: 24, margin: "8px 0" }}>Basic Seller</h2>
          <div style={{ fontSize: 32, fontWeight: 800, margin: "14px 0" }}>
            PKR 5,000 <small style={{ fontSize: 13, color: "var(--muted)" }}>/ one-time</small>
          </div>
          <ul style={{ paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8, fontSize: 13 }}>
            <li>Up to 100 active product listings</li>
            <li>Standard warehouse pickup coverage</li>
            <li>Weekly settlement payouts</li>
            <li>Standard customer support</li>
          </ul>
          <button
            type="button"
            className={selectedPlan === "BASIC" ? "primary-button wide" : "secondary-button wide"}
            style={{ marginTop: 24 }}
            onClick={() => handleSelect("BASIC")}
            disabled={loading}
          >
            {loading && selectedPlan === "BASIC" ? "Saving..." : "Select Basic Plan"}
          </button>
        </div>

        {/* PREMIUM PLAN */}
        <div
          className="form-card"
          style={{
            padding: 30,
            border: selectedPlan === "PREMIUM" ? "2px solid var(--primary)" : undefined,
            position: "relative",
          }}
        >
          <span className="eyebrow" style={{ color: "var(--gold)" }}>
            Recommended
          </span>
          <h2 style={{ fontSize: 24, margin: "8px 0" }}>Premium Merchant</h2>
          <div style={{ fontSize: 32, fontWeight: 800, margin: "14px 0" }}>
            PKR 15,999 <small style={{ fontSize: 13, color: "var(--muted)" }}>/ one-time</small>
          </div>
          <ul style={{ paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8, fontSize: 13 }}>
            <li>Unlimited active product listings</li>
            <li>Priority courier assignment & fast delivery</li>
            <li>Dedicated merchant account manager</li>
            <li>Featured homepage placement</li>
            <li>Daily express settlement payouts</li>
          </ul>
          <button
            type="button"
            className={selectedPlan === "PREMIUM" ? "primary-button wide" : "secondary-button wide"}
            style={{ marginTop: 24 }}
            onClick={() => handleSelect("PREMIUM")}
            disabled={loading}
          >
            {loading && selectedPlan === "PREMIUM" ? "Saving..." : "Select Premium Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
