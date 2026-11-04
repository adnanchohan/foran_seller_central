import { useEffect, useState } from "react";
import type { DashboardResponse } from "@foran/contracts";
import { getDashboard } from "../api.js";

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        <p>Loading your seller central workspace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <div className="alert error">{error || "Could not load dashboard"}</div>
      </div>
    );
  }

  const { user, application, payment } = data;

  return (
    <div style={{ maxWidth: 1100, margin: "30px auto", padding: "0 20px" }}>
      <div className="page-heading">
        <span className="eyebrow">Seller Central Overview</span>
        <h1>Welcome, {application?.storeName || user.displayName || "Merchant"}!</h1>
        <p>
          Your store is active on Foran.pk. Manage inventory, view orders, and coordinate pickups.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <div className="form-card" style={{ padding: 24 }}>
          <small className="eyebrow">Store Status</small>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "var(--success)" }}>
            Active & Verified
          </div>
          <small style={{ color: "var(--muted)" }}>Slug: {application?.storeSlug || "N/A"}</small>
        </div>

        <div className="form-card" style={{ padding: 24 }}>
          <small className="eyebrow">Subscription Plan</small>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "var(--primary)" }}>
            {user.plan || "BASIC"}
          </div>
          <small style={{ color: "var(--muted)" }}>
            Paid: PKR {payment?.amount?.toLocaleString() ?? "0"}
          </small>
        </div>

        <div className="form-card" style={{ padding: 24 }}>
          <small className="eyebrow">Dispatch Logistics</small>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
            {application?.pickupCity || "Pakistan"}
          </div>
          <small style={{ color: "var(--muted)" }}>{application?.pickupArea || "Warehouse"}</small>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div className="form-card" style={{ padding: 26 }}>
          <h3>Store Profile Information</h3>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <strong>Store Description:</strong>
              <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>{application?.description}</p>
            </div>
            <div>
              <strong>Warehouse Address:</strong>
              <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                {application?.warehouseAddress}
              </p>
            </div>
            <div>
              <strong>Pickup Coordinator:</strong>
              <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                {application?.pickupContactPerson} ({application?.pickupContactMobile})
              </p>
            </div>
          </div>
        </div>

        <div className="form-card" style={{ padding: 26 }}>
          <h3>Account Information</h3>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <small style={{ color: "var(--muted)" }}>Registered Email:</small>
              <div>{user.email}</div>
            </div>
            <div>
              <small style={{ color: "var(--muted)" }}>CNIC Number:</small>
              <div>{application?.cnicNumber}</div>
            </div>
            <div>
              <small style={{ color: "var(--muted)" }}>Role:</small>
              <div>{user.role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
