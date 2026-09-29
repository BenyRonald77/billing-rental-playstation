/**
 * Aturan billing rental PlayStation.
 * - Sesi dimulai dengan paket: harga flat sesuai harga paket (bayar di muka).
 * - Tambah waktu: prorata dari tarif per jam tipe konsol,
 *   dibulatkan ke atas ke kelipatan Rp500.
 * - Selesai lebih awal: tidak ada refund (paket flat).
 */
export const PEMBULATAN = 500;
export const BATAS_HAMPIR_HABIS_MENIT = 10;

export function biayaTambahan(tarifPerJam: number, menit: number): number {
  if (menit <= 0) throw new Error("menit harus positif");
  const mentah = (tarifPerJam * menit) / 60;
  return Math.ceil(mentah / PEMBULATAN) * PEMBULATAN;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Timestamp "YYYY-MM-DD HH:MM:SS" (waktu lokal), format yang sama dengan versi Python. */
export function tsNow(d: Date = new Date()): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** Geser timestamp "YYYY-MM-DD HH:MM:SS" sejauh menit. */
export function tsAddMinutes(ts: string, menit: number): string {
  const d = new Date(
    Number(ts.slice(0, 4)),
    Number(ts.slice(5, 7)) - 1,
    Number(ts.slice(8, 10)),
    Number(ts.slice(11, 13)),
    Number(ts.slice(14, 16)),
    Number(ts.slice(17, 19)),
  );
  d.setMinutes(d.getMinutes() + menit);
  return tsNow(d);
}

/** Detik tersisa sampai timestamp rencana (boleh negatif). */
export function sisaDetik(selesaiRencana: string, sekarang = new Date()): number {
  const d = new Date(
    Number(selesaiRencana.slice(0, 4)),
    Number(selesaiRencana.slice(5, 7)) - 1,
    Number(selesaiRencana.slice(8, 10)),
    Number(selesaiRencana.slice(11, 13)),
    Number(selesaiRencana.slice(14, 16)),
    Number(selesaiRencana.slice(17, 19)),
  );
  return Math.floor((d.getTime() - sekarang.getTime()) / 1000);
}
