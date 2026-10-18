import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Foran.pk Seller Central home">
      <span className="brand-mark" aria-hidden="true">F</span>
      <span>
        <strong>Foran.pk</strong>
        <small>Seller Central</small>
      </span>
    </Link>
  );
}
