import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { apiRequest } from '../lib/api';
import type { StoreApplication } from '../types';

export function JourneyRedirect() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    async function chooseRoute() {
      if (!appUser) return;
      if (appUser.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }
      if (appUser.dashboardEnabled) {
        navigate('/dashboard', { replace: true });
        return;
      }
      try {
        const { application } = await apiRequest<{ application: StoreApplication | null }>(
          '/onboarding/me/application',
        );
        if (!application || application.status === 'DRAFT') {
          navigate('/onboarding/store', { replace: true });
        } else {
          navigate('/onboarding/approval', { replace: true });
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not restore your onboarding progress.');
      }
    }
    void chooseRoute();
  }, [appUser, navigate]);

  if (error) {
    return (
      <div className="loading-screen">
        <div className="alert error">{error}</div>
        <button className="primary-button" onClick={() => window.location.reload()} type="button">Try again</button>
      </div>
    );
  }
  return <LoadingScreen label="Restoring your onboarding journey…" />;
}
