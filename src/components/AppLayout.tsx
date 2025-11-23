'use client'
import BottomNav from "./BottomNav";
import AppHeader from "./AppHeader";
import GeoGate from "./GeoGate";

export default function AppLayout({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <GeoGate>
      <div className="min-h-[100svh] bg-white font-sans flex flex-col">
        {/* Üst sabit header */}
        <AppHeader userName={userName} />

        {/* İçerik alanı: bottom nav altında kalmasın diye pb-20 veriyorum */}
        <main className="flex-1 px-4 pt-4 pb-24 max-w-md w-full mx-auto">
          {children}
        </main>

        {/* Alt sabit nav */}
        <div className="z-30">
          <BottomNav />
        </div>
      </div>
    </GeoGate>
  );
}
