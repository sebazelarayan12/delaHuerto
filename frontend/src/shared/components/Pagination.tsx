interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []

  pages.push(1)

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)

  return pages
}

const BTN_BASE = 'size-9 inline-flex items-center justify-center rounded-[10px] text-sm font-semibold transition-colors'
const BTN_INACTIVE = `${BTN_BASE} border-[1.5px] border-sand-deep bg-transparent text-brown cursor-pointer hover:bg-sand hover:border-terra hover:text-terra`
const BTN_ACTIVE = `${BTN_BASE} border-none bg-terra text-white font-bold shadow-[0_3px_12px_rgba(196,82,42,0.3)]`
const BTN_DISABLED = `${BTN_BASE} border-[1.5px] border-sand-deep bg-transparent text-brown opacity-40 cursor-not-allowed pointer-events-none`

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null

  const range = buildPageRange(currentPage, totalPages)

  const rangeStart = pageSize ? (currentPage - 1) * pageSize + 1 : null
  const rangeEnd = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : null
  const showInfo = totalItems != null && rangeStart != null && rangeEnd != null

  return (
    <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
      {showInfo ? (
        <span className="text-xs text-muted font-medium">
          Mostrando {rangeStart}–{rangeEnd} de {totalItems} resultados
        </span>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <button
          className={currentPage === 1 ? BTN_DISABLED : BTN_INACTIVE}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Pagina anterior"
        >
          <span className="icon" style={{ fontSize: 20 }}>chevron_left</span>
        </button>

        {range.map((item, i) =>
          item === '...' ? (
            <span key={`ellipsis-after-${range[i - 1]}`} className={`${BTN_BASE} text-muted select-none`}>
              •••
            </span>
          ) : (
            <button
              key={item}
              className={item === currentPage ? BTN_ACTIVE : BTN_INACTIVE}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}

        <button
          className={currentPage === totalPages ? BTN_DISABLED : BTN_INACTIVE}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Pagina siguiente"
        >
          <span className="icon" style={{ fontSize: 20 }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
