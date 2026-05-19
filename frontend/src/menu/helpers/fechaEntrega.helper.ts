const DELIVERY_DAYS_KEY = 'huerto_delivery_days'
const DEFAULT_DELIVERY_DAYS: boolean[] = [true, true, true, true, true, true, false]

function getDeliveryDays(): boolean[] {
  try {
    const raw = localStorage.getItem(DELIVERY_DAYS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length === 7) return parsed
  } catch {}
  return DEFAULT_DELIVERY_DAYS
}

function getNowAR(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map(({ type, value }) => [type, value])
  )
  return new Date(
    Number(parts['year']), Number(parts['month']) - 1, Number(parts['day']),
    Number(parts['hour']), Number(parts['minute']), Number(parts['second'])
  )
}

export function getFechasDisponibles(): readonly Date[] {
  const now = getNowAR()
  const deliveryDays = getDeliveryDays()
  const available: Date[] = []

  for (let i = 0; i <= 60; i++) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    // getDay(): 0=Dom,1=Lun...6=Sab → (day+6)%7 → 0=Lun,6=Dom
    const dayIndex = (candidate.getDay() + 6) % 7
    if (deliveryDays[dayIndex]) {
      available.push(candidate)
    }
  }

  return available
}

export function formatFechaLarga(date: Date): string {
  const raw = date.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function formatFechaCorta(date: Date): string {
  const raw = date.toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getDiasDelMes(year: number, month: number): readonly { key: string; date: Date | null }[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7 // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: { key: string; date: Date | null }[] = []
  for (let i = 0; i < offset; i++) {
    cells.push({ key: `pad-${year}-${month}-${i}`, date: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    cells.push({ key: date.toISOString(), date })
  }
  return cells
}
