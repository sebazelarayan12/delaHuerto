export default function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <label aria-label={label} className="relative inline-block w-11 h-6 cursor-pointer shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="opacity-0 w-0 h-0 absolute" />
      <span className={`absolute inset-0 rounded-full transition-colors duration-200 ${checked ? 'bg-terra' : 'bg-sand-deep'}`} />
      <span className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-all duration-200 ${checked ? 'left-[22px]' : 'left-[3px]'}`} />
    </label>
  )
}
