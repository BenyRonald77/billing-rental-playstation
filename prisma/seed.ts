import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.consoleType.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  // 3 tipe konsol
  const ps3 = await prisma.consoleType.create({ data: { nama: "PS3", tarifPerJam: 5000 } });
  const ps4 = await prisma.consoleType.create({ data: { nama: "PS4", tarifPerJam: 8000 } });
  const ps5 = await prisma.consoleType.create({ data: { nama: "PS5", tarifPerJam: 12000 } });

  // Paket per tipe (nama, durasi_menit, harga)
  const paket = (t: { id: number }, daftar: [string, number, number][]) =>
    Promise.all(
      daftar.map(([nama, durasiMenit, harga]) =>
        prisma.package.create({
          data: { consoleTypeId: t.id, nama, durasiMenit, harga },
        }),
      ),
    );

  await paket(ps3, [
    ["1 Jam", 60, 5000],
    ["2 Jam", 120, 9500],
    ["3 Jam", 180, 13500],
    ["5 Jam", 300, 20000],
  ]);
  await paket(ps4, [
    ["1 Jam", 60, 8000],
    ["2 Jam", 120, 15000],
    ["3 Jam", 180, 21000],
    ["5 Jam", 300, 32000],
  ]);
  await paket(ps5, [
    ["1 Jam", 60, 12000],
    ["2 Jam", 120, 22000],
    ["3 Jam", 180, 30000],
    ["5 Jam", 300, 45000],
  ]);

  // 8 unit
  await Promise.all(
    [
      ["PS3-01", ps3.id],
      ["PS3-02", ps3.id],
      ["PS4-01", ps4.id],
      ["PS4-02", ps4.id],
      ["PS4-03", ps4.id],
      ["PS5-01", ps5.id],
      ["PS5-02", ps5.id],
      ["PS5-03", ps5.id],
    ].map(([nama, consoleTypeId]) =>
      prisma.unit.create({ data: { nama: nama as string, consoleTypeId: consoleTypeId as number } }),
    ),
  );

  console.log("seed selesai: 3 tipe konsol, 12 paket, 8 unit");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
