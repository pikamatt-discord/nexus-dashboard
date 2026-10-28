import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/MainLayout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Containers } from './pages/Containers';
import { NetworkView } from './pages/Network';
import { Storage } from './pages/Storage';
import { Files } from './pages/Files';
import { SecurityUpdates } from './pages/SecurityUpdates';
import { Backups } from './pages/Backups';
import { Events } from './pages/Events';
import { SettingsPage } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="containers" element={<Containers />} />
            <Route path="network" element={<NetworkView />} />
            <Route path="storage" element={<Storage />} />
            <Route path="files" element={<Files />} />
            <Route path="security" element={<SecurityUpdates />} />
            <Route path="backups" element={<Backups />} />
            <Route path="events" element={<Events />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
