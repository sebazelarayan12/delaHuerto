import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import MenuPage from './menu/MenuPage'
import LoginPage from './admin/LoginPage'
import DashboardPage from './admin/DashboardPage'
import CategoriasPage from './admin/categorias/CategoriasPage'
import ProductosPage from './admin/productos/ProductosPage'
import BannerPage from './admin/banner/BannerPage'
import StockPage from './admin/stock/StockPage'
import VentasPage from './admin/ventas/VentasPage'
import PedidosPage from './admin/pedidos/PedidosPage'
import PedidoResultadoPage from './menu/pages/PedidoResultadoPage'
import ProtectedRoute from './shared/components/ProtectedRoute'
import TestBanner from './shared/components/TestBanner'

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <TestBanner />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/pedido/exito" element={<PedidoResultadoPage variant="exito" />} />
        <Route path="/pedido/pendiente" element={<PedidoResultadoPage variant="pendiente" />} />
        <Route path="/pedido/error" element={<PedidoResultadoPage variant="error" />} />
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
        <Route
          path="/admin/stock"
          element={
            <ProtectedRoute>
              <StockPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ventas"
          element={
            <ProtectedRoute>
              <VentasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pedidos"
          element={
            <ProtectedRoute>
              <PedidosPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}
