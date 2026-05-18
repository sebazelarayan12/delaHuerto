import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { VentaAdmin } from './hooks/useVentas'

const PAD = { top: 16, right: 12, bottom: 30, left: 50 }
const TOTAL_H = 240
const INNER_H = TOTAL_H - PAD.top - PAD.bottom
const TERRA = '#C4522A'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0 })
const fmtK = (n: number) => {
  if (n === 0) return '$0'
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n}`
}

interface DayData {
  label: string
  fullLabel: string
  value: number
  count: number
}

function buildData(ventas: VentaAdmin[], days: number): DayData[] {
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = days - 1 - i
    const start = new Date(today)
    start.setDate(today.getDate() - d)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    const dayVentas = ventas.filter((v) => {
      const f = new Date(v.fecha)
      return f >= start && f <= end
    })

    const label = start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
      .replace('.', '')
    const fullLabel = start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

    return {
      label,
      fullLabel,
      value: dayVentas.reduce((s, v) => s + parseFloat(v.total), 0),
      count: dayVentas.length,
    }
  })
}

interface TendenciaChartProps {
  ventas: VentaAdmin[]
}

export function TendenciaChart({ ventas }: TendenciaChartProps) {
  const [period, setPeriod] = useState<7 | 14 | 30>(30)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [chartWidth, setChartWidth] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setChartWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const data = useMemo(() => buildData(ventas, period), [ventas, period])

  const innerW = chartWidth - PAD.left - PAD.right
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const roundedMax = Math.ceil(maxVal / 5000) * 5000 || 5000

  const scaleX = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * innerW : 0)
  const scaleY = (v: number) => INNER_H - (v / roundedMax) * INNER_H

  const pts: [number, number][] = data.map((d, i) => [scaleX(i), scaleY(d.value)])

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${innerW.toFixed(1)},${INNER_H} L0,${INNER_H} Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: Math.round(roundedMax * t),
    y: scaleY(roundedMax * t),
  }))

  const xStep = Math.max(1, Math.ceil(data.length / 8))

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left - PAD.left
    let closest = 0
    let minDist = Infinity
    pts.forEach(([x], i) => {
      const dist = Math.abs(x - mouseX)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setHoverIdx(closest)
  }, [pts])

  const hoverPt = hoverIdx !== null ? pts[hoverIdx] : null
  const hoverDatum = hoverIdx !== null ? data[hoverIdx] : null

  const tooltipLeft = hoverPt ? Math.max(4, Math.min(PAD.left + hoverPt[0] - 65, chartWidth - 134)) : 0
  const tooltipTop = hoverPt ? Math.max(4, PAD.top + hoverPt[1] - 72) : 0

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(44,18,8,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-sand flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display text-[20px] font-extrabold text-espresso">Tendencia de ingresos</div>
          <div className="text-xs text-muted mt-0.5">Total facturado por dia — ultimos {period} dias</div>
        </div>

        <div className="flex items-center bg-sand rounded-[10px] p-1 gap-0.5 shrink-0">
          {([7, 14, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none font-sans ${
                period === p
                  ? 'bg-white text-terra shadow-[0_1px_4px_rgba(44,18,8,0.1)]'
                  : 'bg-transparent text-brown'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative" style={{ height: TOTAL_H + 8 }}>
        <svg
          width={chartWidth}
          height={TOTAL_H}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
          style={{ cursor: 'crosshair', display: 'block' }}
        >
          <defs>
            <linearGradient id="tc-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TERRA} stopOpacity="0.28" />
              <stop offset="100%" stopColor={TERRA} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1="0" y1={t.y.toFixed(1)}
                  x2={innerW.toFixed(1)} y2={t.y.toFixed(1)}
                  stroke="#F3E8D8"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? undefined : '3,4'}
                />
                <text
                  x="-8" y={t.y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="600"
                  fill="#9A7A66"
                >
                  {fmtK(t.value)}
                </text>
              </g>
            ))}

            <path d={areaPath} fill="url(#tc-area-grad)" />
            <path d={linePath} stroke={TERRA} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {pts.map((p, i) => (
              <circle
                key={i}
                cx={p[0]} cy={p[1]}
                r={hoverIdx === i ? 5 : 3}
                fill={hoverIdx === i ? TERRA : '#FFFDF9'}
                stroke={TERRA}
                strokeWidth="2"
                style={{ transition: 'r 0.15s' }}
              />
            ))}

            {data.map((d, i) => {
              if (i % xStep !== 0 && i !== data.length - 1) return null
              return (
                <text
                  key={i}
                  x={scaleX(i).toFixed(1)}
                  y={INNER_H + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="600"
                  fill="#9A7A66"
                >
                  {d.label}
                </text>
              )
            })}

            {hoverIdx !== null && hoverPt && (
              <line
                x1={hoverPt[0].toFixed(1)} y1="0"
                x2={hoverPt[0].toFixed(1)} y2={INNER_H}
                stroke={TERRA}
                strokeOpacity="0.5"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            )}
          </g>
        </svg>

        {hoverIdx !== null && hoverDatum && hoverPt && (
          <div
            className="absolute pointer-events-none"
            style={{ left: tooltipLeft, top: tooltipTop, zIndex: 20 }}
          >
            <div
              className="rounded-[10px] px-3 py-2"
              style={{ background: '#2C1208', boxShadow: '0 6px 16px rgba(0,0,0,0.2)', minWidth: 130 }}
            >
              <div style={{ fontSize: 11, color: '#D4920A', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                {hoverDatum.fullLabel}
              </div>
              <div className="font-display font-extrabold text-white" style={{ fontSize: 17, marginTop: 2 }}>
                {fmt(hoverDatum.value)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1, fontFamily: 'Manrope, sans-serif' }}>
                {hoverDatum.count} {hoverDatum.count === 1 ? 'venta' : 'ventas'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
