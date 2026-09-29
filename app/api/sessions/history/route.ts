import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/format";

/** Riwayat sesi selesai pada tanggal tertentu (default hari ini). */
export async function GET(req: NextRequest) {
  const tanggal = req.nextUrl.searchParams.get("date") || today();
  const rows = (await prisma.$queryRaw`
    SELECT s.id, s.unit_id, s.package_id, s.nama_pelanggan, s.mulai,
           s.selesai_rencana, s.menit_tambahan, s.selesai_aktual, s.status,
           s.total_harga, u.nama AS nama_unit, p.nama AS nama_paket
    FROM sessions s
    JOIN units u ON u.id = s.unit_id
    JOIN packages p ON p.id = s.package_id
    WHERE date(s.mulai) = ${tanggal} AND s.status = 'selesai'
    ORDER BY s.mulai DESC
  `) as Record<string, unknown>[];
  return NextResponse.json(rows);
}
