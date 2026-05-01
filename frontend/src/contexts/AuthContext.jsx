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
    if (!auth) { setUser(null); return; }  // Firebase not configured — treat as guest
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading: user === undefined, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
