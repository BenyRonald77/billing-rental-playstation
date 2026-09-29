import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError, requireFields } from "@/lib/api";

export async function GET() {
  const rows = await prisma.unit.findMany({
    include: { consoleType: true },
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(
    rows.map((u) => ({
      id: u.id,
      nama: u.nama,
      console_type_id: u.consoleTypeId,
      tipe_konsol: u.consoleType.nama,
      tarif_per_jam: u.consoleType.tarifPerJam,
    })),
  );
}

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const missing = requireFields(data, ["nama", "console_type_id"]);
  if (missing)
    return NextResponse.json({ error: missing }, { status: 400 });
  try {
    const d = data as Record<string, unknown>;
    const r = await prisma.unit.create({
      data: { nama: String(d.nama), consoleTypeId: Number(d.console_type_id) },
    });
    return NextResponse.json(
      { id: r.id, nama: r.nama, console_type_id: r.consoleTypeId },
      { status: 201 },
    );
  } catch (e) {
    return dbError(e);
  }
}
