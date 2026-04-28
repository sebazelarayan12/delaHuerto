export default function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#C4522A" />
      <path d="M8 22 Q12 10 18 14 Q24 18 28 10" stroke="#FBF1D8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="18" cy="22" rx="8" ry="5" fill="#E8A838" opacity="0.9" />
      <path d="M10 22 Q14 28 18 27 Q22 28 26 22" stroke="#C4522A" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
