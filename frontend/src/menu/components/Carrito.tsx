import type { ItemCarrito } from '../hooks/useCarrito'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

interface Props {
  open: boolean
  onClose: () => void
  items: ItemCarrito[]
  total: number
  subtotal: number
  montoDescuento: number
  cantidadTotal: number
  onIncrementar: (id: number) => void
  onDecrementar: (id: number) => void
  onConfirmar: () => void
}

export default function Carrito({ open, onClose, items, total, subtotal, montoDescuento, cantidadTotal, onIncrementar, onDecrementar, onConfirmar }: Props) {
  return (
    <div
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      className={`fixed inset-0 bg-[#2C1208]/55 z-50 flex justify-end max-w-[430px] mx-auto transition-opacity duration-300 ease-in-out ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className={`w-[92%] max-w-[400px] h-full bg-ivory flex flex-col overflow-hidden transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="pt-5 px-5 pb-4 border-b border-sand flex items-center justify-between bg-espresso">
          <div>
            <div className="font-display text-[20px] font-extrabold text-gold-light">
              Tu pedido
            </div>
            <div className="text-xs text-gold mt-0.5 font-semibold">
              {cantidadTotal} docena{cantidadTotal !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="bg-white/10 border-none rounded-full w-11 h-11 cursor-pointer text-gold-light flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <span className="icon text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="text-center py-[60px] px-6 text-muted">
              <span className="icon text-[48px] text-muted block mb-3">shopping_cart</span>
              <div className="font-semibold">El carrito está vacío</div>
              <div className="text-[13px] mt-1">Agregá productos desde el menú</div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productoId}
                className="flex items-center gap-3 px-5 py-3 border-b border-sand"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-espresso overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.nombre}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {fmt(item.precio)} c/u · Subtotal: {fmt(item.precio * item.cantidad)}
                  </div>
                </div>
                <div className="flex items-center bg-terra rounded-full overflow-hidden h-11">
                  <button
                    onClick={() => onDecrementar(item.productoId)}
                    aria-label={`Reducir cantidad de ${item.nombre}`}
                    className="w-11 h-11 border-none bg-transparent text-white text-[18px] font-bold cursor-pointer flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="min-w-[22px] text-center text-white text-sm font-bold tabular-nums">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => onIncrementar(item.productoId)}
                    aria-label={`Aumentar cantidad de ${item.nombre}`}
                    className="w-11 h-11 border-none bg-transparent text-white text-[18px] font-bold cursor-pointer flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 px-5 pb-7 border-t-2 border-sand bg-cream">
            {montoDescuento > 0 && (
              <>
                <div className="flex justify-between text-[13px] text-muted mb-1.5">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] text-green-700 font-semibold mb-3">
                  <span>Descuento</span>
                  <span>-{fmt(montoDescuento)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-sm font-semibold text-brown">Total</span>
              <span className="font-display text-[26px] font-extrabold text-terra">
                {fmt(total)}
              </span>
            </div>
            <button
              onClick={onConfirmar}
              className="w-full p-4 bg-terra border-none rounded-[14px] text-white font-sans text-base font-bold cursor-pointer shadow-[0_4px_16px_rgba(196,82,42,0.4)] transition-colors duration-200 hover:bg-terra-dark"
            >
              Confirmar pedido →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
