import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/axios'
import AdminLayout from './AdminLayout'
import type { Categoria } from '../menu/hooks/useMenu'

interface AdminProducto {
  id: number
  nombre: string
  precio: string
  disponible: boolean
  fotoUrl: string | null
  categoria: Categoria
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: categorias } = useQuery({
    queryKey: ['categorias', 'admin'],
    queryFn: async () => {
      const res = await api.get<Categoria[]>('/api/admin/categorias')
      return res.data
    },
  })

  const { data: productos } = useQuery({
    queryKey: ['productos', 'admin'],
    queryFn: async () => {
      const res = await api.get<AdminProducto[]>('/api/admin/productos')
      return res.data
    },
  })

  const cats = categorias ?? []
  const prods = productos ?? []
  const activeCats = cats.filter((c) => c.activa).length
  const activeProds = prods.filter((p) => p.disponible).length
  const unavailableProds = prods.filter((p) => !p.disponible)
  const avgPrice = prods.length
    ? Math.round(prods.reduce((s, p) => s + parseFloat(p.precio), 0) / prods.length)
    : 0

  const KPIS = [
    { label: 'Productos activos', value: activeProds, icon: 'inventory_2', color: '#C4522A' },
    { label: 'Categorías activas', value: activeCats, icon: 'category', color: '#D4920A' },
    { label: 'Total productos', value: prods.length, icon: 'grid_view', color: '#7A4020' },
    { label: 'Precio prom. / docena', value: fmt(avgPrice), icon: 'payments', color: '#5A8A5A' },
  ]

  return (
    <AdminLayout>
      <div>
        <div className="px-4 lg:px-8 pt-6 lg:pt-8 flex justify-between items-start border-b border-sand-deep pb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-espresso">Buen día 👋</h1>
            <p className="text-sm text-muted mt-1">
              Esto es lo que está pasando hoy con tu menú.
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-terra text-white px-4 py-2 rounded-lg no-underline text-sm font-semibold"
          >
            <span className="icon text-[18px]">storefront</span>
            Ver Tienda
          </a>
        </div>

        <div className="px-4 lg:px-8 py-6 lg:py-7">
          {/* KPIs: 2 cols mobile, 4 cols desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="bg-white rounded-xl p-4 shadow-[0_2px_8px_rgba(44,18,8,0.06)] relative overflow-hidden"
              >
                <div style={{ background: k.color }} className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" />
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="icon icon-fill text-[20px]" style={{ color: k.color }}>{k.icon}</span>
                  <span className="text-xs font-semibold text-muted uppercase tracking-[0.06em] leading-tight">{k.label}</span>
                </div>
                <div className="font-display text-[26px] font-extrabold text-espresso">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Cards: 1 col mobile, 2 cols desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-sand font-bold text-[15px]">
                Accesos rápidos
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {[
                  { label: 'Gestionar categorías', icon: 'category', path: '/admin/categorias' },
                  { label: 'Gestionar productos', icon: 'inventory_2', path: '/admin/productos' },
                ].map((l) => (
                  <button
                    key={l.path}
                    onClick={() => navigate(l.path)}
                    className="flex items-center gap-2.5 px-3.5 py-[11px] rounded-[10px] border-[1.5px] border-sand-deep bg-transparent cursor-pointer w-full font-sans text-sm font-semibold text-brown transition-colors duration-150 hover:bg-sand/30"
                  >
                    <span className="icon text-terra">{l.icon}</span>
                    {l.label}
                    <span className="icon ml-auto text-base text-muted">arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-sand flex items-center gap-2">
                <span className="font-bold text-[15px]">Productos no disponibles</span>
                <span className="bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-xs font-bold">
                  {unavailableProds.length}
                </span>
              </div>
              {unavailableProds.length === 0 ? (
                <div className="px-4 py-5 text-center text-muted text-sm">
                  ✅ Todo disponible
                </div>
              ) : (
                unavailableProds.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 px-4 py-2.5 border-t border-sand">
                    <div className="w-9 h-9 rounded-lg bg-sand flex items-center justify-center text-lg shrink-0">
                      {p.fotoUrl ? (
                        <img src={p.fotoUrl} alt={p.nombre} className="w-full h-full object-cover rounded-lg" />
                      ) : '🥟'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{p.nombre}</div>
                      <div className="text-xs text-muted">{p.categoria.nombre}</div>
                    </div>
                    <span className="bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-xs font-bold shrink-0">
                      Sin stock
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
