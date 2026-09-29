/* Laporan harian: ringkasan, per unit, riwayat sesi. */
function rupiah(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const tglInput = document.getElementById("tglLaporan");
tglInput.value = new Date().toISOString().slice(0, 10);

document.getElementById("formLaporan").addEventListener("submit", async (e) => {
  e.preventDefault();
  const tgl = tglInput.value;
  const rep = await fetch(`/api/reports/daily?date=${tgl}`).then((r) => r.json());
  const hist = await fetch(`/api/sessions/history?date=${tgl}`).then((r) => r.json());

  document.getElementById("statRow").hidden = false;
  document.getElementById("statSesi").textContent = rep.jumlah_sesi;
  document.getElementById("statPendapatan").textContent = rupiah(rep.total_pendapatan);

  document.querySelector("#tblPerUnit tbody").innerHTML = rep.per_unit.length
    ? rep.per_unit.map((r) => `
      <tr><td>${esc(r.nama_unit)}</td><td>${r.jumlah_sesi}</td>
      <td>${rupiah(r.pendapatan)}</td></tr>`).join("")
    : `<tr><td colspan="3" class="empty">Belum ada sesi selesai pada tanggal ini.</td></tr>`;

  document.querySelector("#tblHistory tbody").innerHTML = hist.length
    ? hist.map((s) => `
      <tr><td>${esc(s.nama_pelanggan)}</td><td>${esc(s.nama_unit)}</td>
      <td>${esc(s.nama_paket)}${s.menit_tambahan ? ` (+${s.menit_tambahan} mnt)` : ""}</td>
      <td>${s.mulai}</td><td>${s.selesai_aktual || "-"}</td>
      <td>${s.menit_tambahan ? `+${s.menit_tambahan} mnt` : "-"}</td>
      <td>${rupiah(s.total_harga)}</td></tr>`).join("")
    : `<tr><td colspan="7" class="empty">Belum ada sesi selesai pada tanggal ini.</td></tr>`;
});

document.getElementById("formLaporan").requestSubmit();
