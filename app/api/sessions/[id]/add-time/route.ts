import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { biayaTambahan, tsAddMinutes } from "@/lib/billing";

const toJson = (s: {
  id: number;
  unitId: number;
  packageId: number;
  namaPelanggan: string;
  mulai: string;
  selesaiRencana: string;
  menitTambahan: number;
  selesaiAktual: string | null;
  status: string;
  totalHarga: number;
}) => ({
  id: s.id,
  unit_id: s.unitId,
  package_id: s.packageId,
  nama_pelanggan: s.namaPelanggan,
  mulai: s.mulai,
  selesai_rencana: s.selesaiRencana,
  menit_tambahan: s.menitTambahan,
  selesai_aktual: s.selesaiAktual,
  status: s.status,
  total_harga: s.totalHarga,
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  const data = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const menit = Number(data?.menit ?? 0);
  if (!Number.isFinite(menit))
    return NextResponse.json(
      { error: "menit harus angka" },
      { status: 400 },
    );
  if (menit <= 0)
    return NextResponse.json(
      { error: "menit harus positif" },
      { status: 400 },
    );

  const s = await prisma.session.findUnique({
    where: { id },
    include: { unit: { include: { consoleType: true } } },
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

  let tambahan: number;
  try {
    tambahan = biayaTambahan(s.unit.consoleType.tarifPerJam, menit);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }

  const updated = await prisma.session.update({
    where: { id },
    data: {
      selesaiRencana: tsAddMinutes(s.selesaiRencana, menit),
      menitTambahan: s.menitTambahan + menit,
      totalHarga: s.totalHarga + tambahan,
    },
  });
  return NextResponse.json({ ...toJson(updated), biaya_tambahan: tambahan });
}
