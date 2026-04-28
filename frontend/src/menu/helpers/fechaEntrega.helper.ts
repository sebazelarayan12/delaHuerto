const DIAS_ENTREGA = [5, 6] as const // Viernes, Sabado
const DIAS_ANTICIPACION = 2
const HORA_CORTE = 14

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
  const available: Date[] = []

  for (let i = 1; i <= 28; i++) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)

    if (!(DIAS_ENTREGA as readonly number[]).includes(candidate.getDay())) continue

    const cutoff = new Date(
      candidate.getFullYear(),
      candidate.getMonth(),
      candidate.getDate() - DIAS_ANTICIPACION,
      HORA_CORTE, 0, 0
    )

    if (now < cutoff) available.push(candidate)
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

export function getDiasDelMes(year: number, month: number): readonly (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7 // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array<null>(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d))
  }
  return cells
}
