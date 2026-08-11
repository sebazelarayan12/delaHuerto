interface Props {
  columns: number
  rows?: number
}

export default function TableSkeleton({ columns, rows = 5 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className={r < rows - 1 ? 'border-b border-sand' : ''}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <div
                className="h-4 rounded-full bg-sand animate-pulse motion-reduce:animate-none"
                style={{ width: c === 0 ? '20px' : `${55 + ((c + r) % 3) * 15}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
