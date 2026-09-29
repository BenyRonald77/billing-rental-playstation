"use client";

import { useEffect, useState } from "react";
import { Header, api } from "../components";
import { rupiah, today } from "@/lib/format";

type PerUnit = { nama_unit: string; jumlah_sesi: number; pendapatan: number };
type History = {
  id: number;
  nama_pelanggan: string;
  nama_unit: string;
  nama_paket: string;
  mulai: string;
  selesai_rencana: string;
  selesai_aktual: string | null;
  menit_tambahan: number;
  total_harga: number;
};

export default function Laporan() {
  const [tanggal, setTanggal] = useState(today());
  const [report, setReport] = useState<{
    tanggal: string;
    jumlah_sesi: number;
    total_pendapatan: number;
    per_unit: PerUnit[];
  } | null>(null);
  const [history, setHistory] = useState<History[]>([]);

  const load = async (t: string) => {
    const [r, h] = await Promise.all([
      api(`/api/reports/daily?date=${t}`),
      api(`/api/sessions/history?date=${t}`),
    ]);
    setReport(r);
    setHistory(h);
  };

  useEffect(() => {
    load(tanggal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header />
      <main className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Laporan Pendapatan</h2>
          <input
            type="date"
            className="border rounded px-3 py-1"
            value={tanggal}
            onChange={(e) => {
              setTanggal(e.target.value);
              if (e.target.value) load(e.target.value);
            }}
          />
        </div>

        {report && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-slate-500">Total Sesi</div>
                <div className="text-3xl font-bold">{report.jumlah_sesi}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-slate-500">Total Pendapatan</div>
                <div className="text-3xl font-bold text-emerald-700">
                  {rupiah(report.total_pendapatan)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Pendapatan per Unit</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Unit</th>
                    <th>Sesi</th>
                    <th className="text-right">Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {report.per_unit.map((u) => (
                    <tr key={u.nama_unit} className="border-b">
                      <td className="py-2">{u.nama_unit}</td>
                      <td>{u.jumlah_sesi}</td>
                      <td className="text-right">{rupiah(u.pendapatan)}</td>
                    </tr>
                  ))}
                  {report.per_unit.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">
                        Belum ada sesi selesai pada tanggal ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Riwayat Sesi</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Mulai</th>
                <th>Pelanggan</th>
                <th>Unit</th>
                <th>Paket</th>
                <th>+Menit</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="py-2">{h.mulai}</td>
                  <td>{h.nama_pelanggan}</td>
                  <td>{h.nama_unit}</td>
                  <td>{h.nama_paket}</td>
                  <td>{h.menit_tambahan}</td>
                  <td className="text-right">{rupiah(h.total_harga)}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    Belum ada riwayat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
