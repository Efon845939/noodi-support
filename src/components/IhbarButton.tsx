// src/components/IhbarButton.tsx
"use client";

import Link from "next/link";

export default function IhbarButton() {
  return (
    <Link
      href="/ihbar-olustur"
      className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border"
    >
      İhbar Oluştur
    </Link>
  );
}
