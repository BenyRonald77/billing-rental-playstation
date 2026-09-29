/* Dashboard realtime: polling status unit + timer mundur per detik. */
let units = [];

const grid = document.getElementById("unitGrid");
const summaryEl = document.getElementById("summary");
const clockEl = document.getElementById("clock");
const loadError = document.getElementById("loadError");
const backdrop = document.getElementById("modalBackdrop");
const modalBox = document.getElementById("modalBox");

document.getElementById("retryBtn").addEventListener("click", refresh);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});

function rupiah(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}

function fmtDur(totalDetik) {
  const neg = totalDetik < 0;
  const s = Math.abs(Math.floor(totalDetik));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const d = String(s % 60).padStart(2, "0");
  return (neg ? "-" : "") + `${h}:${m}:${d}`;
}

function sisaDetik(unit) {
  if (!unit.sesi) return null;
  const end = new Date(unit.sesi.selesai_rencana.replace(" ", "T")).getTime();
  return Math.floor((end - Date.now()) / 1000);
}

const STATUS_LABEL = { kosong: "KOSONG", dipakai: "DIPAKAI", hampir_habis: "HAMPIR HABIS" };

function render() {
  const dipakai = units.filter((u) => u.sesi).length;
  const kosong = units.length - dipakai;
  summaryEl.textContent = `${dipakai} dipakai · ${kosong} kosong`;
  loadError.hidden = true;

  grid.innerHTML = "";
  for (const u of units) {
    const card = document.createElement("div");
    card.className = "card" + (u.status === "hampir_habis" ? " expiring" : "");
    card.dataset.unitId = u.id;

    let body = `
      <div class="card-head">
        <div><div class="unit-name">${u.nama}</div>
        <div class="console-type">${u.tipe_konsol}</div></div>
      </div>
      <span class="badge ${u.status}">${STATUS_LABEL[u.status]}</span>`;

    if (u.sesi) {
      const s = u.sesi;
      body += `
        <div class="timer" data-timer>…</div>
        <div class="session-info">${escapeHtml(s.nama_pelanggan)} · ${escapeHtml(s.nama_paket)}${s.menit_tambahan ? ` (+${s.menit_tambahan} mnt)` : ""}</div>
        <div class="bill">${rupiah(s.total_harga)}</div>
        <div class="actions">
          <button data-add="15">+15</button>
          <button data-add="30">+30</button>
          <button data-add="60">+60</button>
          <button class="danger" data-finish="${s.id}">Selesaikan</button>
        </div>`;
    } else {
      body += `
        <div class="actions" style="margin-top:16px">
          <button class="primary" data-start="${u.id}">Mulai Sesi</button>
        </div>`;
    }
    card.innerHTML = body;
    grid.appendChild(card);
  }
  tick();
}

function tick() {
  const t = new Date();
  clockEl.textContent = t.toLocaleTimeString("id-ID", { hour12: false });
  document.querySelectorAll(".card").forEach((card) => {
    const u = units.find((x) => x.id === Number(card.dataset.unitId));
    const timerEl = card.querySelector("[data-timer]");
    if (!u || !u.sesi || !timerEl) return;
    const sisa = sisaDetik(u);
    timerEl.textContent = sisa <= 0 ? "HABIS " + fmtDur(sisa) : fmtDur(sisa);
    timerEl.classList.toggle("over", sisa <= 0);
  });
}

async function refresh() {
  try {
    const r = await fetch("/api/units/status");
    if (!r.ok) throw new Error("HTTP " + r.status);
    units = await r.json();
    render();
    const rep = await fetch("/api/reports/daily").then((x) => x.json());
    summaryEl.textContent += ` · hari ini ${rupiah(rep.total_pendapatan)}`;
  } catch (e) {
    loadError.hidden = false;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function openModal(html) {
  modalBox.innerHTML = html;
  backdrop.hidden = false;
}
function closeModal() {
  backdrop.hidden = true;
  modalBox.innerHTML = "";
}

async function openStartModal(unitId) {
  const u = units.find((x) => x.id === unitId);
  // /api/units/status tidak membawa console_type_id; ambil dari /api/units
  const allUnits = await fetch("/api/units").then((r) => r.json());
  const full = allUnits.find((x) => x.id === unitId);
  const list = await fetch(`/api/packages?console_type_id=${full.console_type_id}`).then((r) => r.json());
  const opts = list.map((p) =>
    `<option value="${p.id}">${escapeHtml(p.nama)} — ${p.durasi_menit} mnt — ${rupiah(p.harga)}</option>`).join("");
  openModal(`
    <h2>Mulai Sesi — ${escapeHtml(u.nama)} (${escapeHtml(u.tipe_konsol)})</h2>
    <div class="field"><label>Nama pelanggan</label>
      <input id="fNama" placeholder="cth: Budi" autofocus></div>
    <div class="field"><label>Paket</label><select id="fPaket">${opts}</select></div>
    <div class="modal-actions">
      <button id="mBatal">Batal</button>
      <button class="primary" id="mMulai">Mulai</button>
    </div>`);
  document.getElementById("mBatal").onclick = closeModal;
  document.getElementById("mMulai").onclick = async () => {
    const nama = document.getElementById("fNama").value.trim();
    const paketId = Number(document.getElementById("fPaket").value);
    if (!nama) { alert("Nama pelanggan wajib diisi"); return; }
    const r = await fetch("/api/sessions/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit_id: unitId, package_id: paketId, nama_pelanggan: nama }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err.error || "Gagal memulai sesi");
      return;
    }
    closeModal();
    refresh();
  };
}

async function addTime(sessionId, menit) {
  const r = await fetch(`/api/sessions/${sessionId}/add-time`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menit }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    alert(err.error || "Gagal menambah waktu");
    return;
  }
  const data = await r.json();
  alert(`Waktu +${menit} menit.\nBiaya tambahan: ${rupiah(data.biaya_tambahan)}\nTotal: ${rupiah(data.total_harga)}`);
  refresh();
}

async function finishSession(sessionId) {
  if (!confirm("Selesaikan sesi ini?")) return;
  const r = await fetch(`/api/sessions/${sessionId}/finish`, { method: "POST" });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    alert(err.error || "Gagal menyelesaikan sesi");
    return;
  }
  const s = await r.json();
  openModal(`
    <div class="struk">
      <h2>Struk Pembayaran</h2>
      <table>
        <tr><td>Pelanggan</td><td>${escapeHtml(s.nama_pelanggan)}</td></tr>
        <tr><td>Unit</td><td>${escapeHtml(s.nama_unit)} (${escapeHtml(s.tipe_konsol)})</td></tr>
        <tr><td>Paket</td><td>${escapeHtml(s.nama_paket)}${s.menit_tambahan ? ` +${s.menit_tambahan} mnt` : ""}</td></tr>
        <tr><td>Mulai</td><td>${s.mulai}</td></tr>
        <tr><td>Selesai</td><td>${s.selesai_aktual}</td></tr>
        <tr class="total"><td>Total</td><td>${rupiah(s.total_harga)}</td></tr>
      </table>
      <div class="modal-actions"><button class="primary" id="mTutup">Tutup</button></div>
    </div>`);
  document.getElementById("mTutup").onclick = () => { closeModal(); refresh(); };
}

grid.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.start) openStartModal(Number(t.dataset.start));
  else if (t.dataset.add) {
    const card = t.closest(".card");
    const u = units.find((x) => x.id === Number(card.dataset.unitId));
    if (u && u.sesi) addTime(u.sesi.id, Number(t.dataset.add));
  } else if (t.dataset.finish) finishSession(Number(t.dataset.finish));
});

refresh();
setInterval(tick, 1000);
setInterval(refresh, 5000);
