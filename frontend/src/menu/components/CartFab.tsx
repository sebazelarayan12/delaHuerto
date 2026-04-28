interface Props {
  cantidadTotal: number
  total: number
  onClick: () => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default function CartFab({ cantidadTotal, total, onClick }: Props) {
  if (cantidadTotal === 0) return null
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-4 bg-terra border-none rounded-full py-3.5 pr-5 pl-4 flex items-center gap-2.5 text-white font-sans text-[15px] font-bold cursor-pointer z-50 shadow-[0_6px_20px_rgba(196,82,42,0.5)] transition-all duration-200 hover:scale-105 hover:bg-terra-dark"
    >
      <span className="icon text-[22px]">shopping_bag</span>
      <span>Ver carrito</span>
      <div className="bg-gold text-espresso rounded-full min-w-[24px] h-6 flex items-center justify-center text-[13px] font-extrabold px-1.5">
        {cantidadTotal}
      </div>
      <span className="ml-1 font-semibold">{fmt(total)}</span>
    </button>
  )
}
