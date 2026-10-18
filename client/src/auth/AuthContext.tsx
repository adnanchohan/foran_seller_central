import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { firebaseAuth, firebaseConfigured } from '../firebase';
import { apiRequest } from '../lib/api';
import type { AppUser } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string;
  signInWithGoogle: () => Promise<AppUser>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshAppUser = useCallback(async () => {
    if (!firebaseAuth?.currentUser) {
      setAppUser(null);
      return null;
    }
    try {
      const { user } = await apiRequest<{ user: AppUser }>('/auth/session');
      setAppUser(user);
      setError('');
      return user;
    } catch (caught) {
      setAppUser(null);
      setError(caught instanceof Error ? caught.message : 'Could not load your account.');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setError('Firebase Web App configuration is missing from client/.env.');
      setLoading(false);
      return;
    }
    return onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      if (user) await refreshAppUser();
      else setAppUser(null);
      setLoading(false);
    });
  }, [refreshAppUser]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseConfigured || !firebaseAuth) {
      throw new Error('Add the Firebase Web App values to client/.env before signing in.');
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(firebaseAuth, provider);
    const user = await refreshAppUser();
    if (!user) throw new Error('Firebase signed in, but the application account could not be loaded.');
    return user;
  }, [refreshAppUser]);

  const signOut = useCallback(async () => {
    if (firebaseAuth) await firebaseSignOut(firebaseAuth);
    setAppUser(null);
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, appUser, loading, error, signInWithGoogle, signOut, refreshAppUser }),
    [firebaseUser, appUser, loading, error, signInWithGoogle, signOut, refreshAppUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
