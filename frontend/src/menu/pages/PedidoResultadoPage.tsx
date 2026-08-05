import { Link } from 'react-router'

interface Props {
  variant: 'exito' | 'pendiente' | 'error'
}

const CONTENIDO = {
  exito: {
    icono: 'celebration',
    titulo: 'Pago confirmado!',
    mensaje: 'Recibimos tu pago. Te vamos a contactar para coordinar la entrega.',
  },
  pendiente: {
    icono: 'schedule',
    titulo: 'Pago en revision',
    mensaje: 'Tu pago esta siendo procesado. Te avisamos por WhatsApp cuando se confirme.',
  },
  error: {
    icono: 'error',
    titulo: 'No se pudo procesar el pago',
    mensaje: 'Algo salio mal con el pago. Volve al menu e intenta de nuevo o elegi otro metodo.',
  },
} as const

export default function PedidoResultadoPage({ variant }: Props) {
  const { icono, titulo, mensaje } = CONTENIDO[variant]

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <span className="icon icon-fill text-[64px] text-terra block mb-4">{icono}</span>
        <h1 className="font-display text-2xl font-semibold text-espresso mb-2">{titulo}</h1>
        <p className="text-muted leading-relaxed mb-7">{mensaje}</p>
        <Link
          to="/"
          className="inline-block w-full p-4 bg-terra rounded-[14px] text-white font-sans text-base font-bold hover:bg-terra-dark transition-colors duration-200"
        >
          Volver al menu
        </Link>
      </div>
    </div>
  )
}
