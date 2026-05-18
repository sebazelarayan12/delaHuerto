import { config } from '../../config/env'

export default function WhatsAppFab() {
  const phone = config.whatsappNumber.replace('+', '')
  const mensaje = encodeURIComponent('Hola! Quiero hacer una consulta')
  const href = `https://wa.me/${phone}?text=${mensaje}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      title="Contactanos por WhatsApp"
      className="relative w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white flex-shrink-0 shadow-[0_6px_20px_rgba(37,211,102,0.45)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#1ebe5a] active:scale-95"
    >
      <span
        className="absolute inset-[-4px] rounded-full border-2 border-[#25D366] opacity-50 pointer-events-none"
        style={{ animation: 'waPulse 2.2s ease-out infinite' }}
      />
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.374 0 0 5.373 0 12c0 2.121.554 4.11 1.522 5.835L.054 23.454a.75.75 0 0 0 .492.942.749.749 0 0 0 .452-.009l5.828-1.861A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.699 9.699 0 0 1-4.95-1.355l-.355-.212-3.682 1.178 1.098-3.574-.231-.369A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
      </svg>
    </a>
  )
}
