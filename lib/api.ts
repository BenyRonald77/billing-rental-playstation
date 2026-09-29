import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** Konversi error Prisma/validasi menjadi respons JSON yang konsisten. */
export function dbError(e: unknown): NextResponse {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json(
        { error: "data sudah ada (duplikat)" },
        { status: 400 },
      );
  }
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status: 400 });
}

/** Kembalikan null jika semua field wajib ada, else pesan error. */
export function requireFields(data: unknown, fields: string[]): string | null {
  const d = data as Record<string, unknown> | null;
  const missing = fields.filter(
    (f) => !d || d[f] === undefined || d[f] === null || d[f] === "",
  );
  return missing.length ? `field wajib: ${missing.join(", ")}` : null;
}
