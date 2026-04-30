export default function TestBanner() {
  if (import.meta.env.VITE_SHOW_TEST_BANNER !== 'true') return null

  return (
    <div className="bg-terra text-cream text-center py-2 px-4 font-sans font-bold text-sm tracking-[0.05em] sticky top-0 z-[9999]">
      PAGINA DE PRUEBAS — Este sitio es el ambiente de testing
    </div>
  )
}
