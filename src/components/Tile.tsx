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
        aspect-[3/2]    /* ÖNCE: 4/3 idi, biraz daha dikey */
        bg-[#D73333]
        text-white
        rounded-2xl
        shadow-md
        flex
        items-center
        justify-center
        text-lg         /* Bir tık büyük */
        font-semibold
        active:scale-95
        transition
      "
    >
      {label}
    </button>
  )
}
