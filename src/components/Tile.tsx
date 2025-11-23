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
        h-[110px]            /* ← bu yükseklik croplara çok yakın */
        bg-[#D73333]
        text-white
        rounded-2xl
        shadow-md
        flex
        items-center
        justify-center
        text-lg
        font-semibold
        active:scale-95
        transition
      "
    >
      {label}
    </button>
  )
}
