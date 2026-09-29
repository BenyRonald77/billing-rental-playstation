import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError, requireFields } from "@/lib/api";
import { tsNow, tsAddMinutes } from "@/lib/billing";

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

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const missing = requireFields(data, [
    "unit_id",
    "package_id",
    "nama_pelanggan",
  ]);
  if (missing)
    return NextResponse.json({ error: missing }, { status: 400 });
  const d = data as Record<string, unknown>;
  const unitId = Number(d.unit_id);
  const packageId = Number(d.package_id);

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { consoleType: true },
    });
    if (!unit)
      return NextResponse.json(
        { error: "unit tidak ditemukan" },
        { status: 404 },
      );
    const paket = await prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!paket)
      return NextResponse.json(
        { error: "paket tidak ditemukan" },
        { status: 404 },
      );
    if (paket.consoleTypeId !== unit.consoleTypeId)
      return NextResponse.json(
        { error: "paket tidak sesuai tipe konsol unit" },
        { status: 400 },
      );
    const aktif = await prisma.session.findFirst({
      where: { unitId: unit.id, status: "aktif" },
    });
    if (aktif)
      return NextResponse.json(
        { error: "unit sedang dipakai" },
        { status: 409 },
      );

    const mulai = tsNow();
    const selesai = tsAddMinutes(mulai, paket.durasiMenit);
    const s = await prisma.session.create({
      data: {
        unitId: unit.id,
        packageId: paket.id,
        namaPelanggan: String(d.nama_pelanggan),
        mulai,
        selesaiRencana: selesai,
        menitTambahan: 0,
        status: "aktif",
        totalHarga: paket.harga,
      },
    });
    return NextResponse.json(toJson(s), { status: 201 });
  } catch (e) {
    return dbError(e);
  }
}
