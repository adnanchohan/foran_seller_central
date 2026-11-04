export function Brand({ subtitle = "Admin Compliance Portal" }: { subtitle?: string }) {
  return (
    <div className="brand">
      <span
        className="brand-mark"
        style={{ background: "linear-gradient(145deg, #b3261e, #d32f2f)" }}
        aria-hidden="true"
      >
        A
      </span>
      <span>
        <strong>Foran.pk</strong>
        <small>{subtitle}</small>
      </span>
    </div>
  );
}
