import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FIELDS = ["nama", "tarif_per_jam"];

export async function GET() {
  const rows = await prisma.consoleType.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(
    rows.map((r) => ({ id: r.id, nama: r.nama, tarif_per_jam: r.tarifPerJam })),
  );
}

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const missing = FIELDS.filter(
    (f) => !data || data[f] === undefined || data[f] === null || data[f] === "",
  );
  if (missing.length)
    return NextResponse.json(
      { error: `field wajib: ${missing.join(", ")}` },
      { status: 400 },
    );
  try {
    const r = await prisma.consoleType.create({
      data: { nama: data.nama, tarifPerJam: Number(data.tarif_per_jam) },
    });
    return NextResponse.json(
      { id: r.id, nama: r.nama, tarif_per_jam: r.tarifPerJam },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
}
