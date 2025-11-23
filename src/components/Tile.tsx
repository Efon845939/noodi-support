export function Tile({
  label,
  onClick,
  size = 'lg',
}: { label: string; onClick?: () => void; size?: 'lg' | 'xl' }) {
  const base =
    "bg-[#D73333] text-white font-extrabold shadow-[0_10px_24px_rgba(0,0,0,.18)] " +
    "active:scale-[.98] transition grid place-items-center leading-tight select-none";
  
  const dims =
    size === 'xl'
      ? "w-[88vw] h-[35vh] max-w-[420px] max-h-[350px] rounded-[24px] text-4xl" // Daha büyük acil durum butonu
      : "w-[88vw] h-[25vh] max-w-[400px] max-h-[250px] rounded-[22px] text-2xl"; // Kişisel yardım butonu

  return (
    <button onClick={onClick} className={`${base} ${dims}`} aria-label={label}>
      <span className="whitespace-pre-wrap text-center">{label}</span>
    </button>
  );
}
