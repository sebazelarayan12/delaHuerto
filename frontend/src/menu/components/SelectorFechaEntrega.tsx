import { useEffect, useRef, useState } from 'react'
import { getDiasDelMes, isSameDay } from '../helpers/fechaEntrega.helper'

interface SelectorFechaEntregaProps {
  readonly fechasDisponibles: readonly Date[]
  readonly selected: Date | null
  readonly onSelect: (date: Date) => void
  readonly onClose: () => void
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'] as const

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export default function SelectorFechaEntrega({ fechasDisponibles, selected, onSelect, onClose }: SelectorFechaEntregaProps) {
  const primerFecha = fechasDisponibles[0] ?? new Date()
  const [mes, setMes] = useState(() => primerFecha.getMonth())
  const [anio, setAnio] = useState(() => primerFecha.getFullYear())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const ultimaFecha = fechasDisponibles[fechasDisponibles.length - 1]
  const hayMesAnterior = fechasDisponibles.some(d => {
    const prevYear = mes === 0 ? anio - 1 : anio
    const prevMonth = mes === 0 ? 11 : mes - 1
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth
  })
  const hayMesSiguiente = ultimaFecha !== undefined && (
    ultimaFecha.getFullYear() > anio ||
    (ultimaFecha.getFullYear() === anio && ultimaFecha.getMonth() > mes)
  )

  function irMesAnterior() {
    if (mes === 0) { setMes(11); setAnio(a => a - 1) }
    else setMes(m => m - 1)
  }

  function irMesSiguiente() {
    if (mes === 11) { setMes(0); setAnio(a => a + 1) }
    else setMes(m => m + 1)
  }

  const celdas = getDiasDelMes(anio, mes)

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 bg-[#FDF6EC] border-[1.5px] border-[#E8D8C4] rounded-2xl px-3 py-3.5 z-10 shadow-[0_8px_24px_rgba(44,18,8,0.12)]"
      style={{ top: 'calc(100% + 6px)' }}
    >
      {/* Header de navegacion */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={irMesAnterior}
          disabled={!hayMesAnterior}
          className="bg-transparent border-0 p-[4px_8px] rounded-lg text-[#2C1208] text-[18px]"
          style={{ cursor: hayMesAnterior ? 'pointer' : 'default', opacity: hayMesAnterior ? 1 : 0.3 }}
          aria-label="Mes anterior"
        >
          &#8249;
        </button>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#2C1208' }}>
          {MESES[mes]} {anio}
        </span>
        <button
          type="button"
          onClick={irMesSiguiente}
          disabled={!hayMesSiguiente}
          className="bg-transparent border-0 p-[4px_8px] rounded-lg text-[#2C1208] text-[18px]"
          style={{ cursor: hayMesSiguiente ? 'pointer' : 'default', opacity: hayMesSiguiente ? 1 : 0.3 }}
          aria-label="Mes siguiente"
        >
          &#8250;
        </button>
      </div>

      {/* Cabecera dias semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DIAS_SEMANA.map(dia => (
          <div key={dia} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9E8C7E', padding: '2px 0' }}>
            {dia}
          </div>
        ))}
      </div>

      {/* Grilla de dias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {celdas.map(({ key, date }) => {
          if (date === null) return <div key={key} />

          const disponible = fechasDisponibles.some(d => isSameDay(d, date))
          const isSelected = selected !== null && isSameDay(date, selected)

          return (
            <button
              key={key}
              type="button"
              disabled={!disponible}
              onClick={() => disponible && onSelect(date)}
              className="rounded-lg text-[13px] p-[6px_2px] text-center transition-[background] duration-[150ms]"
              style={{
                background: isSelected ? '#C4522A' : disponible ? '#FDF0EB' : 'transparent',
                border: disponible && !isSelected ? '1.5px solid #F0C8B0' : '1.5px solid transparent',
                color: isSelected ? '#fff' : disponible ? '#C4522A' : '#C4B5A8',
                cursor: disponible ? 'pointer' : 'default',
                fontWeight: disponible ? 700 : 400,
              }}
              aria-label={disponible ? `Seleccionar ${date.toLocaleDateString('es-AR')}` : undefined}
              aria-pressed={isSelected}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
