import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError } from "@/lib/api";

const toJson = (r: {
  id: number;
  consoleTypeId: number;
  nama: string;
  durasiMenit: number;
  harga: number;
}) => ({
  id: r.id,
  console_type_id: r.consoleTypeId,
  nama: r.nama,
  durasi_menit: r.durasiMenit,
  harga: r.harga,
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  const data = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sets: Record<string, unknown> = {};
  if (data?.console_type_id !== undefined)
    sets.consoleTypeId = Number(data.console_type_id);
  if (data?.nama !== undefined) sets.nama = data.nama;
  if (data?.durasi_menit !== undefined)
    sets.durasiMenit = Number(data.durasi_menit);
  if (data?.harga !== undefined) sets.harga = Number(data.harga);
  if (Object.keys(sets).length === 0)
    return NextResponse.json(
      { error: "tidak ada field yang diubah" },
      { status: 400 },
    );
  try {
    const r = await prisma.package.update({ where: { id }, data: sets });
    return NextResponse.json(toJson(r));
  } catch (e) {
    return dbError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  try {
    await prisma.package.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
