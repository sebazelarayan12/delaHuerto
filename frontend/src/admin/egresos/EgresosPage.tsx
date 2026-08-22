import { useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../AdminLayout'
import { useEgresos } from './hooks/useEgresos'
import { useCategoriasEgreso } from './hooks/useCategoriasEgreso'
import EgresoForm from './EgresoForm'
import CategoriasEgresoModal from './CategoriasEgresoModal'
import TableSkeleton from '../../shared/components/TableSkeleton'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function EgresosPage() {
  const { query, registrar, cancelar } = useEgresos()
  const { query: categoriasQuery } = useCategoriasEgreso()
  const [formOpen, setFormOpen] = useState(false)
  const [categoriasModalOpen, setCategoriasModalOpen] = useState(false)

  const egresos = query.data ?? []
  const categorias = categoriasQuery.data ?? []

  const handleSave = (data: { categoriaId: number; monto: number; descripcion?: string; fecha: string }) => {
    registrar.mutate(data, {
      onSuccess: () => {
        setFormOpen(false)
        toast.success('Egreso registrado')
      },
      onError: () => toast.error('Error al registrar el egreso'),
    })
  }

  const handleCancelar = async (id: number) => {
    try {
      await cancelar.mutateAsync(id)
      toast.success('Egreso eliminado')
    } catch {
      toast.error('Error al eliminar el egreso')
    }
  }

  return (
    <AdminLayout>
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 pb-5 border-b border-sand-deep flex justify-between items-start gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-espresso">Egresos</h1>
          <p className="text-sm text-muted mt-1">{egresos.length} egresos registrados</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setCategoriasModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border-[1.5px] border-sand-deep bg-transparent font-sans text-sm font-semibold text-brown cursor-pointer hover:bg-sand/30"
          >
            <span className="icon text-[18px]">category</span>
            <span className="hidden sm:inline">Categorias</span>
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none bg-terra text-white font-sans text-sm font-semibold cursor-pointer shadow-[0_2px_8px_rgba(196,82,42,0.3)] hover:opacity-90"
          >
            <span className="icon icon-fill text-[18px]">add_circle</span>
            <span className="hidden sm:inline">Registrar egreso</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-sans min-w-[520px]">
              <thead>
                <tr className="bg-gold-light">
                  {['Fecha', 'Categoria', 'Descripcion', 'Monto', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-muted border-b border-sand-deep whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <TableSkeleton columns={5} />
                ) : egresos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                      Sin egresos registrados todavia.
                    </td>
                  </tr>
                ) : (
                  egresos.map((eg, i) => (
                    <tr key={eg.id} className={i < egresos.length - 1 ? 'border-b border-sand' : ''}>
                      <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                        {new Date(eg.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-espresso whitespace-nowrap">
                        {eg.categoria.nombre}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted">
                        {eg.descripcion || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-espresso whitespace-nowrap">
                        {fmt(parseFloat(eg.monto))}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleCancelar(eg.id)}
                          className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-lg border-[1.5px] border-red-200 bg-transparent cursor-pointer text-red-600 transition-colors hover:bg-red-50"
                          title="Eliminar"
                        >
                          <span className="icon text-[17px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EgresoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        categorias={categorias}
        loading={registrar.isPending}
      />

      <CategoriasEgresoModal
        open={categoriasModalOpen}
        onClose={() => setCategoriasModalOpen(false)}
      />
    </AdminLayout>
  )
}
