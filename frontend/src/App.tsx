import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import GoalField from './pages/GoalField';
import ManagerDossier from './pages/ManagerDossier';
import AdminControl from './pages/AdminControl';
import DevSwitcher from './components/DevSwitcher';
import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-meridian-parchment font-mono text-meridian-ink/40 tracking-widest uppercase text-xs">
        Loading Meridian…
      </div>
    );
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-meridian-parchment font-mono text-meridian-ink/40 tracking-widest uppercase text-xs">
        Loading Meridian…
      </div>
    );
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<GoalField />} />
          <Route path="team" element={<ManagerDossier />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminControl />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
      <DevSwitcher />
    </BrowserRouter>
  );
}
