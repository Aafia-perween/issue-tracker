import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Workspaces from './pages/Workspaces';
import Board from './pages/Board';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/workspaces" element={<ProtectedRoute><Workspaces /></ProtectedRoute>} />
      <Route path="/workspaces/:workspaceId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/workspaces" replace />} />
    </Routes>
  );
}