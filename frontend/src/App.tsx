import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import MenuPage from './menu/MenuPage'
import LoginPage from './admin/LoginPage'
import DashboardPage from './admin/DashboardPage'
import CategoriasPage from './admin/categorias/CategoriasPage'
import ProductosPage from './admin/productos/ProductosPage'
import BannerPage from './admin/banner/BannerPage'
import ProtectedRoute from './shared/components/ProtectedRoute'
import TestBanner from './shared/components/TestBanner'

export default function App() {
  return (
    <>
      <TestBanner />
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
        <Route
          path="/admin/banner"
          element={
            <ProtectedRoute>
              <BannerPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}
