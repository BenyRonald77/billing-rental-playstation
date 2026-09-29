import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError, requireFields } from "@/lib/api";

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

export async function GET(req: NextRequest) {
  const ctId = req.nextUrl.searchParams.get("console_type_id");
  const rows = await prisma.package.findMany({
    where: ctId ? { consoleTypeId: Number(ctId) } : undefined,
    orderBy: ctId
      ? { durasiMenit: "asc" }
      : [{ consoleTypeId: "asc" }, { durasiMenit: "asc" }],
  });
  return NextResponse.json(rows.map(toJson));
}

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const missing = requireFields(data, [
    "console_type_id",
    "nama",
    "durasi_menit",
    "harga",
  ]);
  if (missing)
    return NextResponse.json({ error: missing }, { status: 400 });
  try {
    const d = data as Record<string, unknown>;
    const r = await prisma.package.create({
      data: {
        consoleTypeId: Number(d.console_type_id),
        nama: String(d.nama),
        durasiMenit: Number(d.durasi_menit),
        harga: Number(d.harga),
      },
    });
    return NextResponse.json(toJson(r), { status: 201 });
  } catch (e) {
    return dbError(e);
  }
}
