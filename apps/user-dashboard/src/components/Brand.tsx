export function Brand({ subtitle = "Seller Platform" }: { subtitle?: string }) {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        F
      </span>
      <span>
        <strong>Foran.pk</strong>
        <small>{subtitle}</small>
      </span>
    </div>
  );
}
