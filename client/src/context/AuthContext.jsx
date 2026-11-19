import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const role = user?.role || 'user';
  const isAdmin = role === 'admin';
  const currentUserId = user?._id || user?.id;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        currentUserId,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Safe fallback if called outside provider
    const userStr = localStorage.getItem('user');
    let fallbackUser = null;
    try {
      fallbackUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    } catch {
      fallbackUser = null;
    }
    return {
      user: fallbackUser,
      token: localStorage.getItem('token'),
      role: fallbackUser?.role || 'user',
      isAdmin: fallbackUser?.role === 'admin',
      currentUserId: fallbackUser?._id || fallbackUser?.id,
      login: () => {},
      logout: () => {},
      updateUser: () => {}
    };
  }
  return context;
};

export default AuthContext;
