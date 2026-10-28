import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  token: string | null;
  username: string | null;
  login: (token: string, username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('nexus_username'));

  const login = (newToken: string, user: string) => {
    localStorage.setItem('nexus_token', newToken);
    localStorage.setItem('nexus_username', user);
    setToken(newToken);
    setUsername(user);
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_username');
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
