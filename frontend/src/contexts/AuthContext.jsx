/**
 * AuthContext.jsx
 * Provides the current Firebase user and a logout helper to the whole app.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still loading  |  null = logged out  |  object = logged in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    // If Firebase has no real config (env vars missing in this build), skip Auth entirely
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setUser(null);
      return;
    }

    // Safety net: if onAuthStateChanged never fires (broken config), default to guest after 5s
    const timeout = setTimeout(() => setUser(prev => prev === undefined ? null : prev), 5000);

    const unsub = onAuthStateChanged(auth, (u) => {
      clearTimeout(timeout);
      setUser(u ?? null);
    });

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  const logout = () => signOut(auth);

  // Don't render children until we know the auth state
  if (user === undefined) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#00ff88', fontFamily: 'monospace' }}>
        Initializing…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
