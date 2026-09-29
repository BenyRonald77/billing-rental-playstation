import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BATAS_HAMPIR_HABIS_MENIT, sisaDetik } from "@/lib/billing";

/**
 * Semua unit + status hitung: kosong / dipakai / hampir_habis.
 * Sesi aktif membawa sisa detik dari sumber waktu server.
 */
export async function GET() {
  const units = await prisma.unit.findMany({
    include: { consoleType: true },
    orderBy: { nama: "asc" },
  });
  const now = new Date();
  const out = [];
  for (const u of units) {
    const s = await prisma.session.findFirst({
      where: { unitId: u.id, status: "aktif" },
      include: { package: true },
    });
    if (!s) {
      out.push({
        id: u.id,
        nama: u.nama,
        tipe_konsol: u.consoleType.nama,
        status: "kosong",
        sesi: null,
      });
      continue;
    }
    const sisa = sisaDetik(s.selesaiRencana, now);
    out.push({
      id: u.id,
      nama: u.nama,
      tipe_konsol: u.consoleType.nama,
      status: sisa <= BATAS_HAMPIR_HABIS_MENIT * 60 ? "hampir_habis" : "dipakai",
      sesi: {
        id: s.id,
        nama_pelanggan: s.namaPelanggan,
        nama_paket: s.package.nama,
        mulai: s.mulai,
        selesai_rencana: s.selesaiRencana,
        menit_tambahan: s.menitTambahan,
        sisa_detik: Math.max(sisa, 0),
        total_harga: s.totalHarga,
      },
    });
  }
  return NextResponse.json(out);
}
