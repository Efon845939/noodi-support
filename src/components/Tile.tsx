'use client'

export function Tile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full
        aspect-[5/3]           /* ← eskisi 3/2 idi, şimdi daha dik */
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
