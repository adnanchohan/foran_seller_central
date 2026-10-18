import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Brand } from './Brand';

export function Header() {
  const { firebaseUser, appUser, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/signin');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Main navigation">
          {appUser?.role === 'admin' ? (
            <Link to="/admin">Admin Portal</Link>
          ) : firebaseUser ? (
            <>
              <Link to="/">Onboarding</Link>
              {appUser?.dashboardEnabled && <Link to="/dashboard">Dashboard</Link>}
            </>
          ) : (
            <Link to="/signin">Sign In</Link>
          )}
          <a href="mailto:seller-support@foran.pk">Help &amp; Support</a>
        </nav>
        <div className="header-actions">
          <span className="language-pill" title="Full Urdu localization will be added later">
            EN <span>|</span> اردو
          </span>
          {firebaseUser && (
            <button className="text-button" onClick={handleSignOut} type="button">
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
