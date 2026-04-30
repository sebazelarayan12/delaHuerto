import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router'

import LogoMark from '../shared/components/LogoMark'

const NAV = [
  { path: '/admin', label: 'Inicio', icon: 'dashboard' },
  { path: '/admin/categorias', label: 'Categorias', icon: 'category' },
  { path: '/admin/productos', label: 'Productos', icon: 'inventory_2' },
  { path: '/admin/banner', label: 'Banner', icon: 'campaign' },
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
    <aside className="w-[240px] bg-gradient-to-b from-[#2C1208] to-[#4A1E0C] flex flex-col shrink-0 h-dvh">
      <div className="pt-5 px-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <div>
            <div className="font-display text-base font-extrabold text-gold-light leading-none">Huerto</div>
            <div className="text-xs text-gold-muted font-semibold tracking-widest uppercase mt-0.5">Admin</div>
          </div>
        </div>
      </div>

      <nav className="p-3 flex-1 flex flex-col gap-0.5">
        {NAV.map((n) => {
          const active = location.pathname === n.path
          return (
            <button
              key={n.path}
              onClick={() => { navigate(n.path); setSidebarOpen(false) }}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[10px] border-none cursor-pointer font-sans text-sm font-semibold transition-colors duration-150 ${active ? 'bg-terra/25 text-gold-light' : 'bg-transparent text-white/55 hover:text-white/80'}`}
            >
              <span className={`icon${active ? ' icon-fill' : ''}`}>{n.icon}</span>
              {n.label}
            </button>
          )
        })}
      </nav>

      <div className="p-2 border-t border-white/10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 px-3 py-2 pb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terra to-gold flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            C
          </div>
          <div className="overflow-hidden">
            <div className="text-[13px] font-bold text-white">Admin</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[10px] border-none cursor-pointer font-sans text-sm font-semibold bg-transparent text-red-400/70 hover:text-red-400 transition-colors duration-150"
        >
          <span className="icon">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen font-sans bg-cream text-espresso">

      {/* Sidebar desktop */}
      <div className="hidden lg:flex sticky top-0 h-screen shrink-0">
        {Sidebar}
      </div>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setSidebarOpen(false) }}
        />
      )}

      {/* Sidebar mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 transition-transform duration-[250ms] ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {Sidebar}
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">

        {/* Top bar mobile */}
        <div className="flex lg:hidden items-center gap-3 px-4 py-3 border-b border-sand-deep bg-cream sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu de navegacion"
            className="bg-transparent border-none cursor-pointer text-espresso flex items-center justify-center min-w-[44px] min-h-[44px]"
          >
            <span className="icon text-[26px]">menu</span>
          </button>
          <LogoMark size={28} />
          <span className="font-display text-[15px] font-extrabold text-espresso">Huerto Admin</span>
        </div>

        {children}
      </main>
    </div>
  )
}
