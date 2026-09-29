import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError } from "@/lib/api";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  const data = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sets: Record<string, unknown> = {};
  if (data?.nama !== undefined) sets.nama = data.nama;
  if (data?.tarif_per_jam !== undefined)
    sets.tarifPerJam = Number(data.tarif_per_jam);
  if (Object.keys(sets).length === 0)
    return NextResponse.json(
      { error: "tidak ada field yang diubah" },
      { status: 400 },
    );
  try {
    const r = await prisma.consoleType.update({ where: { id }, data: sets });
    return NextResponse.json({
      id: r.id,
      nama: r.nama,
      tarif_per_jam: r.tarifPerJam,
    });
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
    await prisma.consoleType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
