"use client";

import { useEffect, useState } from "react";
import { Header, api } from "../components";
import { rupiah } from "@/lib/format";

type Tipe = { id: number; nama: string; tarif_per_jam: number };
type Paket = {
  id: number;
  console_type_id: number;
  nama: string;
  durasi_menit: number;
  harga: number;
};
type Unit = {
  id: number;
  nama: string;
  console_type_id: number;
  tipe_konsol: string;
  tarif_per_jam: number;
};

async function hapus(path: string, label: string, refresh: () => void) {
  if (!confirm(`Hapus ${label}?`)) return;
  try {
    await api(path, "DELETE");
    refresh();
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e));
  }
}

export default function Master() {
  const [tipe, setTipe] = useState<Tipe[]>([]);
  const [paket, setPaket] = useState<Paket[]>([]);
  const [unit, setUnit] = useState<Unit[]>([]);
  const [fTipe, setFTipe] = useState({ nama: "", tarif_per_jam: "" });
  const [fPaket, setFPaket] = useState({
    console_type_id: "",
    nama: "",
    durasi_menit: "",
    harga: "",
  });
  const [fUnit, setFUnit] = useState({ nama: "", console_type_id: "" });

  const load = async () => {
    const [t, p, u] = await Promise.all([
      api("/api/console-types"),
      api("/api/packages"),
      api("/api/units"),
    ]);
    setTipe(t);
    setPaket(p);
    setUnit(u);
  };

  useEffect(() => {
    load();
  }, []);

  const input =
    "border rounded px-3 py-1.5 text-sm w-full";

  return (
    <>
      <Header />
      <main className="p-6 max-w-6xl mx-auto space-y-8">
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Tipe Konsol</h2>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Nama</th>
                <th>Tarif/Jam</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tipe.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="py-2">{t.nama}</td>
                  <td>{rupiah(t.tarif_per_jam)}</td>
                  <td>
                    <button
                      className="text-red-600 text-xs hover:underline"
                      onClick={() =>
                        hapus(`/api/console-types/${t.id}`, t.nama, load)
                      }
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/api/console-types", "POST", {
                  nama: fTipe.nama,
                  tarif_per_jam: Number(fTipe.tarif_per_jam),
                });
                setFTipe({ nama: "", tarif_per_jam: "" });
                load();
              } catch (err) {
                alert(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            <input
              className={input}
              placeholder="Nama (mis. PS6)"
              value={fTipe.nama}
              onChange={(e) => setFTipe({ ...fTipe, nama: e.target.value })}
              required
            />
            <input
              className={input}
              type="number"
              min={1}
              placeholder="Tarif per jam"
              value={fTipe.tarif_per_jam}
              onChange={(e) =>
                setFTipe({ ...fTipe, tarif_per_jam: e.target.value })
              }
              required
            />
            <button className="bg-slate-900 text-white px-4 py-1.5 rounded text-sm shrink-0">
              Tambah
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Paket</h2>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Tipe</th>
                <th>Nama</th>
                <th>Durasi</th>
                <th>Harga</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paket.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">
                    {tipe.find((t) => t.id === p.console_type_id)?.nama ?? "-"}
                  </td>
                  <td>{p.nama}</td>
                  <td>{p.durasi_menit} mnt</td>
                  <td>{rupiah(p.harga)}</td>
                  <td>
                    <button
                      className="text-red-600 text-xs hover:underline"
                      onClick={() => hapus(`/api/packages/${p.id}`, p.nama, load)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form
            className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/api/packages", "POST", {
                  console_type_id: Number(fPaket.console_type_id),
                  nama: fPaket.nama,
                  durasi_menit: Number(fPaket.durasi_menit),
                  harga: Number(fPaket.harga),
                });
                setFPaket({ console_type_id: "", nama: "", durasi_menit: "", harga: "" });
                load();
              } catch (err) {
                alert(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            <select
              className={input}
              value={fPaket.console_type_id}
              onChange={(e) =>
                setFPaket({ ...fPaket, console_type_id: e.target.value })
              }
              required
            >
              <option value="">Pilih tipe</option>
              {tipe.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
            <input
              className={input}
              placeholder="Nama paket"
              value={fPaket.nama}
              onChange={(e) => setFPaket({ ...fPaket, nama: e.target.value })}
              required
            />
            <input
              className={input}
              type="number"
              min={1}
              placeholder="Durasi (mnt)"
              value={fPaket.durasi_menit}
              onChange={(e) =>
                setFPaket({ ...fPaket, durasi_menit: e.target.value })
              }
              required
            />
            <input
              className={input}
              type="number"
              min={1}
              placeholder="Harga"
              value={fPaket.harga}
              onChange={(e) => setFPaket({ ...fPaket, harga: e.target.value })}
              required
            />
            <button className="bg-slate-900 text-white px-4 py-1.5 rounded text-sm">
              Tambah
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Unit</h2>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Nama</th>
                <th>Tipe</th>
                <th>Tarif/Jam</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {unit.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2">{u.nama}</td>
                  <td>{u.tipe_konsol}</td>
                  <td>{rupiah(u.tarif_per_jam)}</td>
                  <td>
                    <button
                      className="text-red-600 text-xs hover:underline"
                      onClick={() => hapus(`/api/units/${u.id}`, u.nama, load)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/api/units", "POST", {
                  nama: fUnit.nama,
                  console_type_id: Number(fUnit.console_type_id),
                });
                setFUnit({ nama: "", console_type_id: "" });
                load();
              } catch (err) {
                alert(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            <input
              className={input}
              placeholder="Nama unit (mis. PS5-04)"
              value={fUnit.nama}
              onChange={(e) => setFUnit({ ...fUnit, nama: e.target.value })}
              required
            />
            <select
              className={input}
              value={fUnit.console_type_id}
              onChange={(e) =>
                setFUnit({ ...fUnit, console_type_id: e.target.value })
              }
              required
            >
              <option value="">Pilih tipe</option>
              {tipe.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
            <button className="bg-slate-900 text-white px-4 py-1.5 rounded text-sm shrink-0">
              Tambah
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
