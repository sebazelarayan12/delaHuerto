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
        <div className="px-4 lg:px-8 pt-6 lg:pt-8" style={{ borderBottom: '1px solid #E2CFB5', paddingBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2C1208' }}>Buen día 👋</h1>
          <p style={{ fontSize: 14, color: '#9A7A66', marginTop: 4 }}>
            Esto es lo que está pasando hoy con tu menú.
          </p>
        </div>

        <div className="px-4 lg:px-8 py-6 lg:py-7">
          {/* KPIs: 2 cols mobile, 4 cols desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {KPIS.map((k) => (
              <div
                key={k.label}
                style={{
                  background: 'white',
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(44,18,8,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: k.color, borderRadius: '14px 14px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span className="icon icon-fill" style={{ color: k.color, fontSize: 20 }}>{k.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9A7A66', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2 }}>{k.label}</span>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: '#2C1208' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Cards: 1 col mobile, 2 cols desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(44,18,8,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3E8D8', fontWeight: 700, fontSize: 15 }}>
                Accesos rápidos
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Gestionar categorías', icon: 'category', path: '/admin/categorias' },
                  { label: 'Gestionar productos', icon: 'inventory_2', path: '/admin/productos' },
                ].map((l) => (
                  <button
                    key={l.path}
                    onClick={() => navigate(l.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E2CFB5', background: 'transparent', cursor: 'pointer', width: '100%', fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600, color: '#7A4020', transition: 'background 0.15s, color 0.15s' }}
                  >
                    <span className="icon" style={{ color: '#C4522A' }}>{l.icon}</span>
                    {l.label}
                    <span className="icon" style={{ marginLeft: 'auto', fontSize: 16, color: '#9A7A66' }}>arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(44,18,8,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3E8D8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Productos no disponibles</span>
                <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                  {unavailableProds.length}
                </span>
              </div>
              {unavailableProds.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9A7A66', fontSize: 13 }}>
                  ✅ Todo disponible
                </div>
              ) : (
                unavailableProds.slice(0, 5).map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid #F3E8D8' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3E8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {p.fotoUrl ? (
                        <img src={p.fotoUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      ) : '🫔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: '#9A7A66' }}>{p.categoria.nombre}</div>
                    </div>
                    <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
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
