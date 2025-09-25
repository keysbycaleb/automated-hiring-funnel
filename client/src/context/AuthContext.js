import React, { useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase'; // Ensure auth is imported from your firebase config

// 1. Create the context
const AuthContext = React.createContext();

// 2. Create a custom hook for easy consumption of the context
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Create the Provider component
function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false); // Set loading to false once user status is determined
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 4. Export the Provider as the default export
export default AuthProvider;
