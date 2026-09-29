"""Endpoint REST untuk master data: tipe konsol, paket, unit.

(F2 menambahkan endpoint session lifecycle di modul billing/sessions.py.)
"""
from flask import Blueprint, jsonify, request

from billing.db import get_conn

api_bp = Blueprint("api", __name__, url_prefix="/api")


def rows_to_dicts(cur):
    return [dict(r) for r in cur.fetchall()]


def _require_fields(data: dict, fields: list[str]):
    missing = [f for f in fields if f not in data or data[f] in (None, "")]
    if missing:
        return jsonify({"error": f"field wajib: {', '.join(missing)}"}), 400
    return None


# ---------- console_types ----------

@api_bp.get("/console-types")
def list_console_types():
    conn = get_conn()
    try:
        return jsonify(rows_to_dicts(
            conn.execute("SELECT * FROM console_types ORDER BY id")))
    finally:
        conn.close()


@api_bp.post("/console-types")
def create_console_type():
    data = request.get_json(force=True)
    err = _require_fields(data, ["nama", "tarif_per_jam"])
    if err:
        return err
    conn = get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO console_types (nama, tarif_per_jam) VALUES (?, ?)",
            (data["nama"], int(data["tarif_per_jam"])))
        conn.commit()
        row = conn.execute("SELECT * FROM console_types WHERE id = ?",
                           (cur.lastrowid,)).fetchone()
        return jsonify(dict(row)), 201
    except Exception as e:  # noqa: BLE001 - sampaikan pesan DB apa adanya
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@api_bp.put("/console-types/<int:ct_id>")
def update_console_type(ct_id: int):
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        sets, vals = [], []
        for f in ("nama", "tarif_per_jam"):
            if f in data:
                sets.append(f"{f} = ?")
                vals.append(data[f])
        if not sets:
            return jsonify({"error": "tidak ada field yang diubah"}), 400
        vals.append(ct_id)
        cur = conn.execute(
            f"UPDATE console_types SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "tidak ditemukan"}), 404
        row = conn.execute("SELECT * FROM console_types WHERE id = ?",
                           (ct_id,)).fetchone()
        return jsonify(dict(row))
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@api_bp.delete("/console-types/<int:ct_id>")
def delete_console_type(ct_id: int):
    conn = get_conn()
    try:
        cur = conn.execute("DELETE FROM console_types WHERE id = ?", (ct_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "tidak ditemukan"}), 404
        return jsonify({"ok": True})
    except Exception as e:  # noqa: BLE001 - mis. masih dipakai unit/paket
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


# ---------- packages ----------

@api_bp.get("/packages")
def list_packages():
    ct_id = request.args.get("console_type_id")
    conn = get_conn()
    try:
        if ct_id:
            cur = conn.execute(
                "SELECT * FROM packages WHERE console_type_id = ? ORDER BY durasi_menit",
                (ct_id,))
        else:
            cur = conn.execute("SELECT * FROM packages ORDER BY console_type_id, durasi_menit")
        return jsonify(rows_to_dicts(cur))
    finally:
        conn.close()


@api_bp.post("/packages")
def create_package():
    data = request.get_json(force=True)
    err = _require_fields(data, ["console_type_id", "nama", "durasi_menit", "harga"])
    if err:
        return err
    conn = get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO packages (console_type_id, nama, durasi_menit, harga)"
            " VALUES (?, ?, ?, ?)",
            (data["console_type_id"], data["nama"],
             int(data["durasi_menit"]), int(data["harga"])))
        conn.commit()
        row = conn.execute("SELECT * FROM packages WHERE id = ?",
                           (cur.lastrowid,)).fetchone()
        return jsonify(dict(row)), 201
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@api_bp.put("/packages/<int:p_id>")
def update_package(p_id: int):
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        sets, vals = [], []
        for f in ("console_type_id", "nama", "durasi_menit", "harga"):
            if f in data:
                sets.append(f"{f} = ?")
                vals.append(data[f])
        if not sets:
            return jsonify({"error": "tidak ada field yang diubah"}), 400
        vals.append(p_id)
        cur = conn.execute(
            f"UPDATE packages SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "tidak ditemukan"}), 404
        row = conn.execute("SELECT * FROM packages WHERE id = ?", (p_id,)).fetchone()
        return jsonify(dict(row))
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@api_bp.delete("/packages/<int:p_id>")
def delete_package(p_id: int):
    conn = get_conn()
    try:
        cur = conn.execute("DELETE FROM packages WHERE id = ?", (p_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "tidak ditemukan"}), 404
        return jsonify({"ok": True})
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


# ---------- units ----------

@api_bp.get("/units")
def list_units():
    conn = get_conn()
    try:
        cur = conn.execute(
            """SELECT u.id, u.nama, u.console_type_id, ct.nama AS tipe_konsol,
                      ct.tarif_per_jam
               FROM units u JOIN console_types ct ON ct.id = u.console_type_id
               ORDER BY u.nama""")
        return jsonify(rows_to_dicts(cur))
    finally:
        conn.close()


@api_bp.post("/units")
def create_unit():
    data = request.get_json(force=True)
    err = _require_fields(data, ["nama", "console_type_id"])
    if err:
        return err
    conn = get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO units (nama, console_type_id) VALUES (?, ?)",
            (data["nama"], data["console_type_id"]))
        conn.commit()
        row = conn.execute("SELECT * FROM units WHERE id = ?",
                           (cur.lastrowid,)).fetchone()
        return jsonify(dict(row)), 201
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@api_bp.put("/units/<int:u_id>")
def update_unit(u_id: int):
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        sets, vals = [], []
        for f in ("nama", "console_type_id"):
            if f in data:
                sets.append(f"{f} = ?")
                vals.append(data[f])
        if not sets:
            return jsonify({"error": "tidak ada field yang diubah"}), 400
        vals.append(u_id)
        cur = conn.execute(f"UPDATE units SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "tidak ditemukan"}), 404
        row = conn.execute("SELECT * FROM units WHERE id = ?", (u_id,)).fetchone()
        return jsonify(dict(row))
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@api_bp.delete("/units/<int:u_id>")
def delete_unit(u_id: int):
    conn = get_conn()
    try:
        cur = conn.execute("DELETE FROM units WHERE id = ?", (u_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "tidak ditemukan"}), 404
        return jsonify({"ok": True})
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
