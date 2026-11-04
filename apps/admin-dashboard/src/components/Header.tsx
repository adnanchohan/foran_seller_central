import type { User } from "@foran/contracts";
import { Brand } from "./Brand.js";

interface HeaderProps {
  user: User | null;
  onSignOut?: () => void;
  onNavigate?: (path: string) => void;
}

export function Header({ user, onSignOut, onNavigate }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div
          onClick={() => onNavigate?.("/admin")}
          style={{ cursor: "pointer" }}
          role="button"
          tabIndex={0}
        >
          <Brand />
        </div>
        <div className="header-actions">
          {user ? (
            <>
              <span className="language-pill" style={{ color: "var(--error)", fontWeight: 700 }}>
                🛡️ Admin: {user.displayName || user.email}
              </span>
              <button type="button" className="text-button" onClick={onSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <button type="button" className="text-button" onClick={() => onNavigate?.("/signin")}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
