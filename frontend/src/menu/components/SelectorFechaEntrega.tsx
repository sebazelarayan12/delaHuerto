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
      className="absolute left-0 right-0 top-[calc(100%+6px)] bg-cream border-[1.5px] border-sand-deep rounded-2xl px-3 py-3.5 z-10 shadow-[0_8px_24px_rgba(44,18,8,0.12)]"
    >
      {/* Header de navegacion */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={irMesAnterior}
          disabled={!hayMesAnterior}
          className={`bg-transparent border-0 p-[4px_8px] rounded-lg text-espresso text-[18px] ${hayMesAnterior ? 'cursor-pointer opacity-100' : 'cursor-default opacity-30'}`}
          aria-label="Mes anterior"
        >
          &#8249;
        </button>
        <span className="font-bold text-sm text-espresso">
          {MESES[mes]} {anio}
        </span>
        <button
          type="button"
          onClick={irMesSiguiente}
          disabled={!hayMesSiguiente}
          className={`bg-transparent border-0 p-[4px_8px] rounded-lg text-espresso text-[18px] ${hayMesSiguiente ? 'cursor-pointer opacity-100' : 'cursor-default opacity-30'}`}
          aria-label="Mes siguiente"
        >
          &#8250;
        </button>
      </div>

      {/* Cabecera dias semana */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DIAS_SEMANA.map(dia => (
          <div key={dia} className="text-center text-xs font-semibold text-muted py-0.5">
            {dia}
          </div>
        ))}
      </div>

      {/* Grilla de dias */}
      <div className="grid grid-cols-7 gap-0.5">
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
              className={`rounded-lg text-[13px] p-[6px_2px] text-center transition-[background] duration-[150ms] border-[1.5px] ${
                isSelected
                  ? 'bg-terra text-white border-transparent font-bold cursor-pointer'
                  : disponible
                  ? 'bg-[#FDF0EB] text-terra border-[#F0C8B0] font-bold cursor-pointer'
                  : 'bg-transparent text-[#C4B5A8] border-transparent font-normal cursor-default'
              }`}
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
