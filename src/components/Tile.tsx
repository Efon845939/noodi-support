'use client'

export function Tile({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full
        h-[140px]            /* ← daha uzun, ekrandaki kartlara daha yakın */
        sm:h-[150px]
        bg-[#D73333]
        text-white
        rounded-2xl
        shadow-md
        flex
        items-center
        justify-center
        text-center
        text-xl              /* ← yazı biraz büyüdü */
        font-semibold
        tracking-wide
        active:scale-95
        transition
      "
    >
      {label}
    </button>
  )
}
