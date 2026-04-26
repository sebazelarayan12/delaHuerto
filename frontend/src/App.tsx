import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import MenuPage from './menu/MenuPage'
import LoginPage from './admin/LoginPage'
import DashboardPage from './admin/DashboardPage'
import CategoriasPage from './admin/categorias/CategoriasPage'
import ProductosPage from './admin/productos/ProductosPage'
import ProtectedRoute from './shared/components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <ProtectedRoute>
              <CategoriasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute>
              <ProductosPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
