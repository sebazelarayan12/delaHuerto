export default function TestBanner() {
  if (import.meta.env.VITE_SHOW_TEST_BANNER !== 'true') return null

  return (
    <div
      style={{
        backgroundColor: '#C4522A',
        color: '#FDF6EC',
        textAlign: 'center',
        padding: '8px 16px',
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 700,
        fontSize: '14px',
        letterSpacing: '0.05em',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
      }}
    >
      PAGINA DE PRUEBAS — Este sitio es el ambiente de testing
    </div>
  )
}
