import { createContext, useContext, useMemo, useState } from 'react';
import api from './api/client';

const AuthContext = createContext(null);

const savedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('ridenexa_user') || 'null');
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(savedUser);

  const setAuthSession = (userData, token) => {
    if (token) {
      localStorage.setItem('ridenexa_token', token);
    }
    if (userData) {
      localStorage.setItem('ridenexa_user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const login = async (inputOrUser, optionalToken) => {
    // If called with (user, token) directly
    if (optionalToken) {
      setAuthSession(inputOrUser, optionalToken);
      return { user: inputOrUser, token: optionalToken };
    }
    // If called with { email, password }
    const response = await api.post('/auth/login', inputOrUser);
    const { user: loggedInUser, token } = response.data;
    setAuthSession(loggedInUser, token);
    return response.data;
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('ridenexa_user', JSON.stringify(merged));
      return merged;
    });
  };

  const logout = () => {
    localStorage.removeItem('ridenexa_token');
    localStorage.removeItem('ridenexa_user');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      setSession: setAuthSession,
      updateUser,
      logout
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
