"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="bg-slate-900 text-white px-6 py-4 flex items-center gap-8">
      <h1 className="text-lg font-bold">Billing Rental PlayStation</h1>
      <nav className="flex gap-4 text-sm">
        <Link href="/" className="text-slate-300 hover:text-white">
          Dashboard
        </Link>
        <Link href="/laporan" className="text-slate-300 hover:text-white">
          Laporan
        </Link>
        <Link href="/master" className="text-slate-300 hover:text-white">
          Master Data
        </Link>
      </nav>
    </header>
  );
}

export const STATUS_LABEL: Record<string, string> = {
  kosong: "Kosong",
  dipakai: "Dipakai",
  hampir_habis: "Hampir Habis",
};

export const STATUS_COLOR: Record<string, string> = {
  kosong: "bg-slate-200 text-slate-700",
  dipakai: "bg-green-200 text-green-800",
  hampir_habis: "bg-amber-200 text-amber-800",
};

export async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
