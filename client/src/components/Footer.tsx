export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Foran.pk Marketplace</strong>
        <span>© {new Date().getFullYear()} National eCommerce Operations Pakistan.</span>
      </div>
      <nav aria-label="Legal navigation">
        <a href="#seller-policy">Seller Policy</a>
        <a href="#terms">Terms of Service</a>
        <a href="#compliance">Merchant Compliance</a>
      </nav>
    </footer>
  );
}
