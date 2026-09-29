import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/format";

/** Laporan pendapatan harian: total + rincian per unit. */
export async function GET(req: NextRequest) {
  const tanggal = req.nextUrl.searchParams.get("date") || today();
  const agg = (await prisma.$queryRaw`
    SELECT COUNT(*) AS jumlah_sesi,
           COALESCE(SUM(total_harga), 0) AS total_pendapatan
    FROM sessions
    WHERE date(mulai) = ${tanggal} AND status = 'selesai'
  `) as { jumlah_sesi: bigint; total_pendapatan: bigint }[];
  const perUnit = (await prisma.$queryRaw`
    SELECT u.nama AS nama_unit, COUNT(*) AS jumlah_sesi,
           SUM(s.total_harga) AS pendapatan
    FROM sessions s JOIN units u ON u.id = s.unit_id
    WHERE date(s.mulai) = ${tanggal} AND s.status = 'selesai'
    GROUP BY u.id ORDER BY pendapatan DESC
  `) as { nama_unit: string; jumlah_sesi: bigint; pendapatan: bigint }[];

  return NextResponse.json({
    tanggal,
    jumlah_sesi: Number(agg[0]?.jumlah_sesi ?? 0),
    total_pendapatan: Number(agg[0]?.total_pendapatan ?? 0),
    per_unit: perUnit.map((r) => ({
      nama_unit: r.nama_unit,
      jumlah_sesi: Number(r.jumlah_sesi),
      pendapatan: Number(r.pendapatan),
    })),
  });
}
