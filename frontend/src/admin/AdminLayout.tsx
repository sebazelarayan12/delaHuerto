import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router'

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#C4522A" />
      <path d="M8 22 Q12 10 18 14 Q24 18 28 10" stroke="#FBF1D8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="18" cy="22" rx="8" ry="5" fill="#E8A838" opacity="0.9" />
      <path d="M10 22 Q14 28 18 27 Q22 28 26 22" stroke="#C4522A" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

const NAV = [
  { path: '/admin', label: 'Inicio', icon: 'dashboard' },
  { path: '/admin/categorias', label: 'Categorías', icon: 'category' },
  { path: '/admin/productos', label: 'Productos', icon: 'inventory_2' },
]

interface Props {
  children: ReactNode
}

export default function AdminLayout({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem('empanadas_admin_token')
    navigate('/admin/login')
  }

  const Sidebar = (
    <aside
      style={{
        width: 240,
        background: 'linear-gradient(180deg, #2C1208 0%, #4A1E0C 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
      }}
    >
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={36} />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: '#FBF1D8', lineHeight: 1 }}>Huerto</div>
            <div style={{ fontSize: 10, color: '#C49060', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Admin</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {NAV.map((n) => {
          const active = location.pathname === n.path
          return (
            <button
              key={n.path}
              onClick={() => { navigate(n.path); setSidebarOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                marginBottom: 2,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                background: active ? 'rgba(196,82,42,0.25)' : 'transparent',
                color: active ? '#FBF1D8' : 'rgba(255,255,255,0.55)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span className={`icon${active ? ' icon-fill' : ''}`}>{n.icon}</span>
              {n.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px 12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #C4522A, #E8A838)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
            C
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Admin</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, background: 'transparent', color: 'rgba(255,100,80,0.7)', transition: 'background 0.15s, color 0.15s' }}
        >
          <span className="icon">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Manrope', sans-serif", background: '#FDF6EC', color: '#2C1208' }}>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        {Sidebar}
      </div>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setSidebarOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Sidebar mobile drawer */}
      <div
        className="lg:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {Sidebar}
      </div>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>

        {/* Top bar mobile */}
        <div
          className="flex lg:hidden items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid #E2CFB5', background: '#FDF6EC', position: 'sticky', top: 0, zIndex: 30 }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2C1208', display: 'flex', alignItems: 'center' }}
          >
            <span className="icon" style={{ fontSize: 26 }}>menu</span>
          </button>
          <LogoMark size={28} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 800, color: '#2C1208' }}>Huerto Admin</span>
        </div>

        {children}
      </main>
    </div>
  )
}
