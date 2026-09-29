"""Session lifecycle: mulai, tambah waktu, selesai, status unit, riwayat."""
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from billing.db import get_conn
from billing.pricing import BATAS_HAMPIR_HABIS_MENIT, biaya_tambahan

sessions_bp = Blueprint("sessions", __name__, url_prefix="/api")

FMT = "%Y-%m-%d %H:%M:%S"


def now() -> datetime:
    return datetime.now().replace(microsecond=0)


def parse(ts: str) -> datetime:
    return datetime.strptime(ts, FMT)


@sessions_bp.get("/units/status")
def unit_status():
    """Semua unit + status hitung: kosong / dipakai / hampir_habis."""
    conn = get_conn()
    try:
        units = [dict(r) for r in conn.execute(
            """SELECT u.id, u.nama, ct.nama AS tipe_konsol
               FROM units u JOIN console_types ct ON ct.id = u.console_type_id
               ORDER BY u.nama""").fetchall()]
        out = []
        t = now()
        for u in units:
            s = conn.execute(
                """SELECT s.*, p.nama AS nama_paket, p.durasi_menit
                   FROM sessions s JOIN packages p ON p.id = s.package_id
                   WHERE s.unit_id = ? AND s.status = 'aktif'""",
                (u["id"],)).fetchone()
            if s is None:
                out.append({**u, "status": "kosong", "sesi": None})
                continue
            sisa = int((parse(s["selesai_rencana"]) - t).total_seconds())
            status = ("hampir_habis"
                      if sisa <= BATAS_HAMPIR_HABIS_MENIT * 60 else "dipakai")
            out.append({**u, "status": status, "sesi": {
                "id": s["id"],
                "nama_pelanggan": s["nama_pelanggan"],
                "nama_paket": s["nama_paket"],
                "mulai": s["mulai"],
                "selesai_rencana": s["selesai_rencana"],
                "menit_tambahan": s["menit_tambahan"],
                "sisa_detik": max(sisa, 0),
                "total_harga": s["total_harga"],
            }})
        return jsonify(out)
    finally:
        conn.close()


@sessions_bp.post("/sessions/start")
def start_session():
    data = request.get_json(force=True)
    for f in ("unit_id", "package_id", "nama_pelanggan"):
        if f not in data or data[f] in (None, ""):
            return jsonify({"error": f"field wajib: {f}"}), 400
    conn = get_conn()
    try:
        unit = conn.execute(
            """SELECT u.*, ct.tarif_per_jam FROM units u
               JOIN console_types ct ON ct.id = u.console_type_id
               WHERE u.id = ?""", (data["unit_id"],)).fetchone()
        if unit is None:
            return jsonify({"error": "unit tidak ditemukan"}), 404
        paket = conn.execute("SELECT * FROM packages WHERE id = ?",
                             (data["package_id"],)).fetchone()
        if paket is None:
            return jsonify({"error": "paket tidak ditemukan"}), 404
        if paket["console_type_id"] != unit["console_type_id"]:
            return jsonify({"error": "paket tidak sesuai tipe konsol unit"}), 400
        aktif = conn.execute(
            "SELECT id FROM sessions WHERE unit_id = ? AND status = 'aktif'",
            (unit["id"],)).fetchone()
        if aktif:
            return jsonify({"error": "unit sedang dipakai"}), 409

        mulai = now()
        selesai = mulai + timedelta(minutes=int(paket["durasi_menit"]))
        cur = conn.execute(
            """INSERT INTO sessions
               (unit_id, package_id, nama_pelanggan, mulai, selesai_rencana,
                menit_tambahan, status, total_harga)
               VALUES (?, ?, ?, ?, ?, 0, 'aktif', ?)""",
            (unit["id"], paket["id"], data["nama_pelanggan"],
             mulai.strftime(FMT), selesai.strftime(FMT), paket["harga"]))
        conn.commit()
        row = conn.execute("SELECT * FROM sessions WHERE id = ?",
                           (cur.lastrowid,)).fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@sessions_bp.post("/sessions/<int:s_id>/add-time")
def add_time(s_id: int):
    data = request.get_json(force=True)
    try:
        menit = int(data.get("menit", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "menit harus angka"}), 400
    if menit <= 0:
        return jsonify({"error": "menit harus positif"}), 400
    conn = get_conn()
    try:
        s = conn.execute(
            """SELECT s.*, ct.tarif_per_jam FROM sessions s
               JOIN units u ON u.id = s.unit_id
               JOIN console_types ct ON ct.id = u.console_type_id
               WHERE s.id = ?""", (s_id,)).fetchone()
        if s is None:
            return jsonify({"error": "sesi tidak ditemukan"}), 404
        if s["status"] != "aktif":
            return jsonify({"error": "sesi sudah selesai"}), 400
        tambahan = biaya_tambahan(s["tarif_per_jam"], menit)
        selesai_baru = parse(s["selesai_rencana"]) + timedelta(minutes=menit)
        conn.execute(
            """UPDATE sessions SET selesai_rencana = ?, menit_tambahan = ?,
                                  total_harga = ? WHERE id = ?""",
            (selesai_baru.strftime(FMT), s["menit_tambahan"] + menit,
             s["total_harga"] + tambahan, s_id))
        conn.commit()
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (s_id,)).fetchone()
        return jsonify({**dict(row), "biaya_tambahan": tambahan})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@sessions_bp.post("/sessions/<int:s_id>/finish")
def finish_session(s_id: int):
    conn = get_conn()
    try:
        s = conn.execute(
            """SELECT s.*, u.nama AS nama_unit, ct.nama AS tipe_konsol,
                      p.nama AS nama_paket
               FROM sessions s
               JOIN units u ON u.id = s.unit_id
               JOIN console_types ct ON ct.id = u.console_type_id
               JOIN packages p ON p.id = s.package_id
               WHERE s.id = ?""", (s_id,)).fetchone()
        if s is None:
            return jsonify({"error": "sesi tidak ditemukan"}), 404
        if s["status"] != "aktif":
            return jsonify({"error": "sesi sudah selesai"}), 400
        selesai = now()
        conn.execute(
            "UPDATE sessions SET status = 'selesai', selesai_aktual = ? WHERE id = ?",
            (selesai.strftime(FMT), s_id))
        conn.commit()
        return jsonify({
            "id": s["id"],
            "nama_pelanggan": s["nama_pelanggan"],
            "nama_unit": s["nama_unit"],
            "tipe_konsol": s["tipe_konsol"],
            "nama_paket": s["nama_paket"],
            "mulai": s["mulai"],
            "selesai_aktual": selesai.strftime(FMT),
            "menit_tambahan": s["menit_tambahan"],
            "total_harga": s["total_harga"],
        })
    finally:
        conn.close()


@sessions_bp.get("/sessions/history")
def history():
    tanggal = request.args.get("date", now().strftime("%Y-%m-%d"))
    conn = get_conn()
    try:
        cur = conn.execute(
            """SELECT s.*, u.nama AS nama_unit, p.nama AS nama_paket
               FROM sessions s
               JOIN units u ON u.id = s.unit_id
               JOIN packages p ON p.id = s.package_id
               WHERE date(s.mulai) = ? AND s.status = 'selesai'
               ORDER BY s.mulai DESC""", (tanggal,))
        return jsonify([dict(r) for r in cur.fetchall()])
    finally:
        conn.close()


@sessions_bp.get("/reports/daily")
def daily_report():
    tanggal = request.args.get("date", now().strftime("%Y-%m-%d"))
    conn = get_conn()
    try:
        r = conn.execute(
            """SELECT COUNT(*) AS jumlah_sesi,
                      COALESCE(SUM(total_harga), 0) AS total_pendapatan
               FROM sessions WHERE date(mulai) = ? AND status = 'selesai'""",
            (tanggal,)).fetchone()
        per_unit = [dict(x) for x in conn.execute(
            """SELECT u.nama AS nama_unit, COUNT(*) AS jumlah_sesi,
                      SUM(s.total_harga) AS pendapatan
               FROM sessions s JOIN units u ON u.id = s.unit_id
               WHERE date(s.mulai) = ? AND s.status = 'selesai'
               GROUP BY u.id ORDER BY pendapatan DESC""", (tanggal,)).fetchall()]
        return jsonify({"tanggal": tanggal, "jumlah_sesi": r["jumlah_sesi"],
                        "total_pendapatan": r["total_pendapatan"],
                        "per_unit": per_unit})
    finally:
        conn.close()
