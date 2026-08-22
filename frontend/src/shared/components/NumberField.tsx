import { NumericFormat } from 'react-number-format'

interface NumberFieldProps {
  id?: string
  value: number | undefined | null
  onValueChange: (value: number | undefined) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  decimalScale?: number
  allowNegative?: boolean
  title?: string
}

export default function NumberField({
  id,
  value,
  onValueChange,
  onBlur,
  placeholder,
  className,
  decimalScale = 0,
  allowNegative = false,
  title,
}: NumberFieldProps) {
  return (
    <NumericFormat
      id={id}
      title={title}
      value={value ?? ''}
      onValueChange={(values) => onValueChange(values.floatValue)}
      onBlur={onBlur}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={decimalScale}
      allowNegative={allowNegative}
      placeholder={placeholder}
      className={className}
      inputMode="numeric"
    />
  )
}
