/* CRUD master data: tipe konsol, paket, unit. */
function rupiah(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || ("HTTP " + r.status));
  return data;
}

let consoleTypes = [];
let editing = { console: null, package: null, unit: null };

async function loadConsoleTypes() {
  consoleTypes = await api("GET", "/api/console-types");
  const tbody = document.querySelector("#tblConsole tbody");
  tbody.innerHTML = consoleTypes.map((c) => `
    <tr><td>${esc(c.nama)}</td><td>${rupiah(c.tarif_per_jam)}</td>
    <td class="row-actions">
      <button data-edit-console="${c.id}">Ubah</button>
      <button class="danger" data-del-console="${c.id}">Hapus</button>
    </td></tr>`).join("");
  for (const sel of ["#selPackageType", "#selUnitType"]) {
    document.querySelector(sel).innerHTML = consoleTypes
      .map((c) => `<option value="${c.id}">${esc(c.nama)}</option>`).join("");
  }
}

async function loadPackages() {
  const list = await api("GET", "/api/packages");
  const namaTipe = Object.fromEntries(consoleTypes.map((c) => [c.id, c.nama]));
  document.querySelector("#tblPackage tbody").innerHTML = list.map((p) => `
    <tr><td>${esc(namaTipe[p.console_type_id] || "-")}</td>
    <td>${esc(p.nama)}</td><td>${p.durasi_menit} mnt</td><td>${rupiah(p.harga)}</td>
    <td class="row-actions">
      <button data-edit-package="${p.id}">Ubah</button>
      <button class="danger" data-del-package="${p.id}">Hapus</button>
    </td></tr>`).join("");
}

async function loadUnits() {
  const list = await api("GET", "/api/units");
  document.querySelector("#tblUnit tbody").innerHTML = list.map((u) => `
    <tr><td>${esc(u.nama)}</td><td>${esc(u.tipe_konsol)}</td>
    <td class="row-actions">
      <button data-edit-unit="${u.id}">Ubah</button>
      <button class="danger" data-del-unit="${u.id}">Hapus</button>
    </td></tr>`).join("");
}

async function refreshAll() {
  await loadConsoleTypes();
  await loadPackages();
  await loadUnits();
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

// ---- tipe konsol ----
document.getElementById("formConsole").addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = formData(e.target);
  try {
    if (editing.console) {
      await api("PUT", `/api/console-types/${editing.console}`, {
        nama: d.nama, tarif_per_jam: Number(d.tarif_per_jam) });
      editing.console = null;
      document.getElementById("batalConsole").hidden = true;
      e.target.querySelector("[type=submit]").textContent = "Tambah";
    } else {
      await api("POST", "/api/console-types", {
        nama: d.nama, tarif_per_jam: Number(d.tarif_per_jam) });
    }
    e.target.reset();
    refreshAll();
  } catch (err) { alert(err.message); }
});
document.getElementById("batalConsole").addEventListener("click", (e) => {
  editing.console = null;
  e.target.hidden = true;
  const f = document.getElementById("formConsole");
  f.reset();
  f.querySelector("[type=submit]").textContent = "Tambah";
});

// ---- paket ----
document.getElementById("formPackage").addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = formData(e.target);
  const payload = {
    console_type_id: Number(d.console_type_id), nama: d.nama,
    durasi_menit: Number(d.durasi_menit), harga: Number(d.harga),
  };
  try {
    if (editing.package) {
      await api("PUT", `/api/packages/${editing.package}`, payload);
      editing.package = null;
      document.getElementById("batalPackage").hidden = true;
      e.target.querySelector("[type=submit]").textContent = "Tambah";
    } else {
      await api("POST", "/api/packages", payload);
    }
    e.target.reset();
    refreshAll();
  } catch (err) { alert(err.message); }
});
document.getElementById("batalPackage").addEventListener("click", (e) => {
  editing.package = null;
  e.target.hidden = true;
  const f = document.getElementById("formPackage");
  f.reset();
  f.querySelector("[type=submit]").textContent = "Tambah";
});

// ---- unit ----
document.getElementById("formUnit").addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = formData(e.target);
  const payload = { nama: d.nama, console_type_id: Number(d.console_type_id) };
  try {
    if (editing.unit) {
      await api("PUT", `/api/units/${editing.unit}`, payload);
      editing.unit = null;
      document.getElementById("batalUnit").hidden = true;
      e.target.querySelector("[type=submit]").textContent = "Tambah";
    } else {
      await api("POST", "/api/units", payload);
    }
    e.target.reset();
    refreshAll();
  } catch (err) { alert(err.message); }
});
document.getElementById("batalUnit").addEventListener("click", (e) => {
  editing.unit = null;
  e.target.hidden = true;
  const f = document.getElementById("formUnit");
  f.reset();
  f.querySelector("[type=submit]").textContent = "Tambah";
});

// ---- aksi baris (event delegation) ----
document.addEventListener("click", async (e) => {
  const t = e.target;
  const get = (k) => t.dataset[k];
  try {
    if (get("delConsole")) {
      if (!confirm("Hapus tipe konsol ini?")) return;
      await api("DELETE", `/api/console-types/${get("delConsole")}`);
    } else if (get("delPackage")) {
      if (!confirm("Hapus paket ini?")) return;
      await api("DELETE", `/api/packages/${get("delPackage")}`);
    } else if (get("delUnit")) {
      if (!confirm("Hapus unit ini?")) return;
      await api("DELETE", `/api/units/${get("delUnit")}`);
    } else if (get("editConsole")) {
      const c = consoleTypes.find((x) => x.id === Number(get("editConsole")));
      const f = document.getElementById("formConsole");
      f.nama.value = c.nama; f.tarif_per_jam.value = c.tarif_per_jam;
      editing.console = c.id;
      document.getElementById("batalConsole").hidden = false;
      f.querySelector("[type=submit]").textContent = "Simpan";
      return;
    } else if (get("editPackage")) {
      const list = await api("GET", "/api/packages");
      const p = list.find((x) => x.id === Number(get("editPackage")));
      const f = document.getElementById("formPackage");
      f.console_type_id.value = p.console_type_id;
      f.nama.value = p.nama; f.durasi_menit.value = p.durasi_menit; f.harga.value = p.harga;
      editing.package = p.id;
      document.getElementById("batalPackage").hidden = false;
      f.querySelector("[type=submit]").textContent = "Simpan";
      return;
    } else if (get("editUnit")) {
      const list = await api("GET", "/api/units");
      const u = list.find((x) => x.id === Number(get("editUnit")));
      const f = document.getElementById("formUnit");
      f.nama.value = u.nama; f.console_type_id.value = u.console_type_id;
      editing.unit = u.id;
      document.getElementById("batalUnit").hidden = false;
      f.querySelector("[type=submit]").textContent = "Simpan";
      return;
    } else {
      return;
    }
    refreshAll();
  } catch (err) { alert(err.message); }
});

refreshAll();
