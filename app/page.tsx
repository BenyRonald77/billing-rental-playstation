"use client";

import { useEffect, useRef, useState } from "react";
import { Header, STATUS_LABEL, STATUS_COLOR, api } from "./components";
import { rupiah } from "@/lib/format";

type Sesi = {
  id: number;
  nama_pelanggan: string;
  nama_paket: string;
  mulai: string;
  selesai_rencana: string;
  menit_tambahan: number;
  sisa_detik: number;
  total_harga: number;
};

type Unit = {
  id: number;
  nama: string;
  tipe_konsol: string;
  status: string;
  sesi: Sesi | null;
};

type Paket = {
  id: number;
  console_type_id: number;
  nama: string;
  durasi_menit: number;
  harga: number;
};

function fmtSisa(det: number) {
  const d = Math.max(det, 0);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = d % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsMaster, setUnitsMaster] = useState<Record<number, number>>({});
  const [tick, setTick] = useState(0);
  const [modalUnit, setModalUnit] = useState<Unit | null>(null);
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [paketId, setPaketId] = useState<number | "">("");
  const fetchedAt = useRef<number>(Date.now());

  const load = async () => {
    const [st, mu] = await Promise.all([
      api("/api/units/status"),
      api("/api/units"),
    ]);
    setUnits(st);
    const map: Record<number, number> = {};
    for (const u of mu) map[u.id] = u.console_type_id;
    setUnitsMaster(map);
    fetchedAt.current = Date.now();
  };

  useEffect(() => {
    load();
    const p = setInterval(load, 5000);
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => {
      clearInterval(p);
      clearInterval(t);
    };
  }, []);

  const openModal = async (u: Unit) => {
    setModalUnit(u);
    setNamaPelanggan("");
    const ctId = unitsMaster[u.id];
    const pkgs = await api(`/api/packages?console_type_id=${ctId}`);
    setPaketList(pkgs);
    setPaketId(pkgs[0]?.id ?? "");
  };

  const mulaiSesi = async () => {
    if (!modalUnit || !namaPelanggan || !paketId) return;
    try {
      await api("/api/sessions/start", "POST", {
        unit_id: modalUnit.id,
        package_id: paketId,
        nama_pelanggan: namaPelanggan,
      });
      setModalUnit(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const tambahWaktu = async (sesiId: number, menit: number) => {
    try {
      const r = await api(`/api/sessions/${sesiId}/add-time`, "POST", { menit });
      alert(
        `Waktu ditambah ${menit} menit. Biaya tambahan: ${rupiah(r.biaya_tambahan)}. Total: ${rupiah(r.total_harga)}.`,
      );
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const selesaikan = async (sesiId: number) => {
    if (!confirm("Selesaikan sesi ini?")) return;
    try {
      const r = await api(`/api/sessions/${sesiId}/finish`, "POST");
      alert(
        `Struk — ${r.nama_unit} (${r.tipe_konsol})\n` +
          `Pelanggan: ${r.nama_pelanggan}\nPaket: ${r.nama_paket}\n` +
          `Mulai: ${r.mulai}\nSelesai: ${r.selesai_aktual}\n` +
          `Tambahan: ${r.menit_tambahan} menit\nTotal: ${rupiah(r.total_harga)}` +
          `\n(Selesai lebih awal: tidak ada refund, paket bersifat flat)`,
      );
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const elapsed = Math.floor((Date.now() - fetchedAt.current) / 1000);

  return (
    <>
      <Header />
      <main className="p-6 max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Status Unit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {units.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-lg shadow p-4 border border-slate-200"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-bold text-lg">{u.nama}</div>
                  <div className="text-sm text-slate-500">{u.tipe_konsol}</div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[u.status]}`}
                >
                  {STATUS_LABEL[u.status]}
                </span>
              </div>
              {u.sesi ? (
                <div className="space-y-1 text-sm">
                  <div className="font-mono text-2xl font-bold text-slate-800">
                    {fmtSisa(u.sesi.sisa_detik - elapsed)}
                  </div>
                  <div>
                    <span className="text-slate-500">Pelanggan: </span>
                    {u.sesi.nama_pelanggan}
                  </div>
                  <div>
                    <span className="text-slate-500">Paket: </span>
                    {u.sesi.nama_paket}
                    {u.sesi.menit_tambahan > 0 &&
                      ` (+${u.sesi.menit_tambahan} mnt)`}
                  </div>
                  <div className="font-semibold">
                    Total: {rupiah(u.sesi.total_harga)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      onClick={() => tambahWaktu(u.sesi!.id, 30)}
                    >
                      +30 mnt
                    </button>
                    <button
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      onClick={() => tambahWaktu(u.sesi!.id, 60)}
                    >
                      +1 jam
                    </button>
                    <button
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      onClick={() => {
                        const m = prompt("Tambah berapa menit?");
                        if (m) tambahWaktu(u.sesi!.id, Number(m));
                      }}
                    >
                      Custom
                    </button>
                    <button
                      className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                      onClick={() => selesaikan(u.sesi!.id)}
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="mt-2 w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-700 text-sm"
                  onClick={() => openModal(u)}
                >
                  Mulai Sesi
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Status disinkron tiap 5 detik dari server.
        </p>
      </main>

      {modalUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">
              Mulai Sesi — {modalUnit.nama} ({modalUnit.tipe_konsol})
            </h3>
            <div>
              <label className="text-sm text-slate-500">Nama pelanggan</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                placeholder="Nama pelanggan"
              />
            </div>
            <div>
              <label className="text-sm text-slate-500">Paket</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={paketId}
                onChange={(e) => setPaketId(Number(e.target.value))}
              >
                {paketList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} — {rupiah(p.harga)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => setModalUnit(null)}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-700"
                onClick={mulaiSesi}
              >
                Mulai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
