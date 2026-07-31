import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '@/pages/Login';
import Tablero from '@/pages/Tablero';
import DetalleExpediente from '@/pages/DetalleExpediente';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Tablero />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expediente/:id"
        element={
          <ProtectedRoute>
            <DetalleExpediente />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
