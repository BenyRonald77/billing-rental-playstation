import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tsNow } from "@/lib/billing";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      unit: { include: { consoleType: true } },
      package: true,
    },
  });
  if (!s)
    return NextResponse.json(
      { error: "sesi tidak ditemukan" },
      { status: 404 },
    );
  if (s.status !== "aktif")
    return NextResponse.json(
      { error: "sesi sudah selesai" },
      { status: 400 },
    );

  const selesai = tsNow();
  await prisma.session.update({
    where: { id },
    data: { status: "selesai", selesaiAktual: selesai },
  });

  return NextResponse.json({
    id: s.id,
    nama_pelanggan: s.namaPelanggan,
    nama_unit: s.unit.nama,
    tipe_konsol: s.unit.consoleType.nama,
    nama_paket: s.package.nama,
    mulai: s.mulai,
    selesai_aktual: selesai,
    menit_tambahan: s.menitTambahan,
    total_harga: s.totalHarga,
  });
}
