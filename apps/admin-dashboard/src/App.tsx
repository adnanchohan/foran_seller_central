import { useCallback, useEffect, useState } from "react";
import type { User } from "@foran/contracts";
import { getSession, signInWithGoogleCredential, signOut } from "./api.js";
import { Footer } from "./components/Footer.js";
import { Header } from "./components/Header.js";
import { AdminPage } from "./pages/AdminPage.js";
import { SignInPage } from "./pages/SignInPage.js";
import { parseRoute } from "./router.js";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pathname, setPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/admin",
  );

  const navigate = useCallback((to: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", to);
      setPathname(to);
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const currentUser = await getSession();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [refreshState]);

  const handleSignIn = async (credential: string) => {
    const signedInUser = await signInWithGoogleCredential(credential);
    setUser(signedInUser);
    navigate("/admin");
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    navigate("/signin");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        <p>Loading admin compliance workspace...</p>
      </div>
    );
  }

  const currentRoute = parseRoute(pathname);

  if (!user && currentRoute.name !== "signin") {
    return (
      <div className="app-frame">
        <Header user={null} onNavigate={navigate} />
        <main>
          <SignInPage onSignIn={handleSignIn} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-frame">
      <Header user={user} onSignOut={handleSignOut} onNavigate={navigate} />
      <main>
        {currentRoute.name === "signin" && <SignInPage onSignIn={handleSignIn} />}
        {currentRoute.name === "admin" && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}
