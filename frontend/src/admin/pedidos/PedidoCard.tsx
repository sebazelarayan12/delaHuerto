import type { PedidoAdmin } from './hooks/usePedidos'
import { ESTADO_META, fmtPedidoDate, fmtDeliveryDate } from './helpers/pedido.helpers'

const fmt = (n: number | string) =>
  '$' + parseFloat(String(n)).toLocaleString('es-AR', { minimumFractionDigits: 0 })

interface Props {
  pedido: PedidoAdmin
  onMarcarPagado: (id: number) => void
  onMarcarEntregado: (id: number) => void
  onCancelar: (id: number) => void
  onEditar: (pedido: PedidoAdmin) => void
}

export default function PedidoCard({ pedido, onMarcarPagado, onMarcarEntregado, onCancelar, onEditar }: Props) {
  const meta = ESTADO_META[pedido.estado]
  const deliveryYmd = pedido.fechaEntrega ? pedido.fechaEntrega.split('T')[0] : ''

  return (
    <div
      className="bg-[#FFFDF9] rounded-[18px] border border-[1.5px] border-sand flex flex-col gap-3 p-[18px]"
      style={{ boxShadow: '0 2px 8px rgba(44,18,8,0.06)' }}
    >
      {/* Header: nombre + badge */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-extrabold leading-tight text-espresso">
            {pedido.nombre}
          </div>
          {pedido.telefono && (
            <div className="flex items-center gap-[5px] mt-[6px] text-[13px] font-medium text-muted">
              <span className="icon" style={{ fontSize: 15 }}>phone</span>
              {pedido.telefono}
            </div>
          )}
          {pedido.direccion && (
            <div className="flex items-start gap-[5px] mt-1 text-[13px] font-medium text-muted">
              <span className="icon mt-px" style={{ fontSize: 15 }}>location_on</span>
              <span>{pedido.direccion}</span>
            </div>
          )}
        </div>
        <span
          className="px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap flex-shrink-0"
          style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
        >
          {meta.label}
        </span>
      </div>

      {/* Items */}
      <div className="border-t border-sand pt-3 flex flex-col gap-1">
        {deliveryYmd && (
          <div
            className="inline-flex items-center gap-[6px] px-[10px] py-[6px] rounded-lg text-[12.5px] font-bold mb-1 self-start"
            style={{ background: '#F5DDD4', color: '#A0401E' }}
          >
            <span className="icon icon-fill" style={{ fontSize: 15 }}>event</span>
            Entrega: {fmtDeliveryDate(deliveryYmd)}
          </div>
        )}
        {pedido.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-2 text-[13px] text-brown">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-1.5">
              <strong className="text-espresso">{item.cantidad}x</strong> {item.producto.nombre}
              <span className={`text-[9px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full shrink-0 ${item.modalidad === 'cocinada' ? 'bg-cocinada/15 text-cocinada' : 'bg-congelada/15 text-congelada'}`}>
                {item.modalidad === 'cocinada' ? 'Cocinada' : 'Congelada'}
              </span>
            </span>
            <span className="flex-shrink-0 text-muted">
              {fmt(parseFloat(item.precioUnitario) * item.cantidad)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px dashed #F3E8D8' }}>
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-brown">Total</span>
        <span className="text-[15px] font-extrabold text-espresso">{fmt(pedido.total)}</span>
      </div>

      {/* Indicador pagado */}
      {pedido.estado === 'por_entregar' && (
        <div className="flex items-center gap-[5px] text-[12px] font-bold" style={{ color: '#15803d' }}>
          <span className="icon icon-fill" style={{ fontSize: 15 }}>payments</span>
          Pagado
        </div>
      )}

      {/* Footer: fecha + acciones */}
      <div className="flex justify-between items-center gap-2 mt-1 flex-wrap">
        <span className="text-[11.5px] font-semibold text-muted">
          {fmtPedidoDate(pedido.creadoEn)}
        </span>
        <div className="flex gap-2 flex-shrink-0">
          {pedido.estado === 'pendiente' && (
            <>
              <button
                className="inline-flex items-center gap-1 bg-[#FFFDF9] text-brown border-[1.5px] border-sand-deep px-[14px] py-2 rounded-[10px] font-sans text-[13px] font-bold cursor-pointer transition-colors hover:bg-sand"
                onClick={() => onEditar(pedido)}
              >
                <span className="icon" style={{ fontSize: 16 }}>edit</span>
                Editar
              </button>
              <button
                className="inline-flex items-center gap-1 bg-[#FFFDF9] text-terra border-[1.5px] border-terra-light px-[14px] py-2 rounded-[10px] font-sans text-[13px] font-bold cursor-pointer transition-colors hover:bg-terra-light"
                onClick={() => onCancelar(pedido.id)}
              >
                <span className="icon" style={{ fontSize: 16 }}>close</span>
                Cancelar
              </button>
              <button
                className="inline-flex items-center gap-1 bg-terra text-white px-[14px] py-2 rounded-[10px] font-sans text-[13px] font-bold cursor-pointer transition-colors hover:bg-terra-dark"
                style={{ boxShadow: '0 3px 12px rgba(196,82,42,0.3)' }}
                onClick={() => onMarcarPagado(pedido.id)}
              >
                <span className="icon icon-fill" style={{ fontSize: 16 }}>payments</span>
                Marcar pagado
              </button>
            </>
          )}
          {pedido.estado === 'por_entregar' && (
            <button
              className="inline-flex items-center gap-1 text-white px-[14px] py-2 rounded-[10px] font-sans text-[13px] font-bold cursor-pointer transition-colors"
              style={{ background: '#D4920A', boxShadow: '0 3px 12px rgba(212,146,10,0.3)' }}
              onClick={() => onMarcarEntregado(pedido.id)}
            >
              <span className="icon icon-fill" style={{ fontSize: 16 }}>check_circle</span>
              Marcar entregado
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
