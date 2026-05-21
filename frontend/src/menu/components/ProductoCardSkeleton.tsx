export default function ProductoCardSkeleton() {
  return (
    <div className="flex gap-3 p-3.5 rounded-2xl bg-white shadow-[0_2px_10px_rgba(44,18,8,0.07)]">
      <div className="w-[88px] h-[88px] md:w-[110px] md:h-[110px] shrink-0 rounded-2xl bg-sand animate-pulse" />
      <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
        <div className="h-4 rounded-lg bg-sand animate-pulse w-3/4" />
        <div className="h-3 rounded-lg bg-sand animate-pulse w-full" />
        <div className="h-3 rounded-lg bg-sand animate-pulse w-2/3" />
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <div className="h-5 rounded-lg bg-sand animate-pulse w-1/4" />
          <div className="size-11 rounded-full bg-sand animate-pulse" />
        </div>
      </div>
    </div>
  )
}
