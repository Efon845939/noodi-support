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
        aspect-[3/2]        /* biraz dikey, telefon için daha iyi */
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
