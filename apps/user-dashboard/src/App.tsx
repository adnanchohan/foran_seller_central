import { useCallback, useEffect, useState } from "react";
import type { StoreApplication, User } from "@foran/contracts";
import { getMyApplication, getSession, signInWithGoogleCredential, signOut } from "./api.js";
import { Footer } from "./components/Footer.js";
import { Header } from "./components/Header.js";
import { LoadingScreen } from "./components/LoadingScreen.js";
import { OnboardingStepper } from "./components/OnboardingStepper.js";
import { ApprovalPage } from "./pages/ApprovalPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { PaymentPage } from "./pages/PaymentPage.js";
import { PlansPage } from "./pages/PlansPage.js";
import { SignInPage } from "./pages/SignInPage.js";
import { StoreProfilePage } from "./pages/StoreProfilePage.js";
import { parseRoute } from "./router.js";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [application, setApplication] = useState<StoreApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [pathname, setPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/",
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
      if (currentUser) {
        const appData = await getMyApplication();
        setApplication(appData);
      } else {
        setApplication(null);
      }
    } catch {
      setUser(null);
      setApplication(null);
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
    const appData = await getMyApplication();
    setApplication(appData);
    navigate("/");
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    setApplication(null);
    navigate("/signin");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const currentRoute = parseRoute(pathname);

  // If not signed in, redirect to sign in (unless already there)
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

  // Journey redirect handler for root /
  if (currentRoute.name === "journey" || currentRoute.name === "not_found") {
    if (!user) {
      navigate("/signin");
    } else if (user.dashboardEnabled) {
      navigate("/dashboard");
    } else if (!application || application.status === "DRAFT") {
      navigate("/onboarding/store");
    } else if (
      application.status === "PENDING_REVIEW" ||
      application.status === "CHANGES_REQUIRED"
    ) {
      navigate("/onboarding/approval");
    } else if (application.status === "APPROVED" && !user.plan) {
      navigate("/onboarding/plans");
    } else {
      navigate("/onboarding/payment");
    }
  }

  // Calculate current onboarding step for the stepper
  let currentStep = 1;
  if (currentRoute.name === "approval") currentStep = 2;
  if (currentRoute.name === "plans") currentStep = 3;
  if (currentRoute.name === "payment") currentStep = 4;

  const isOnboarding = ["store", "approval", "plans", "payment"].includes(currentRoute.name);

  return (
    <div className="app-frame">
      <Header user={user} onSignOut={handleSignOut} onNavigate={navigate} />
      {isOnboarding && <OnboardingStepper currentStep={currentStep} />}
      <main>
        {currentRoute.name === "signin" && <SignInPage onSignIn={handleSignIn} />}
        {currentRoute.name === "store" && (
          <StoreProfilePage
            application={application}
            onRefresh={refreshState}
            onNavigate={navigate}
          />
        )}
        {currentRoute.name === "approval" && (
          <ApprovalPage application={application} onNavigate={navigate} onRefresh={refreshState} />
        )}
        {currentRoute.name === "plans" && (
          <PlansPage user={user} onRefresh={refreshState} onNavigate={navigate} />
        )}
        {currentRoute.name === "payment" && (
          <PaymentPage user={user} onRefresh={refreshState} onNavigate={navigate} />
        )}
        {currentRoute.name === "dashboard" && <DashboardPage />}
      </main>
      <Footer />
    </div>
  );
}
