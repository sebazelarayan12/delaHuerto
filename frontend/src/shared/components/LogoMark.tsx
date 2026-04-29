export default function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Huerto Empanadas"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  )
}
