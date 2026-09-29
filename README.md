# Billing Rental PlayStation

Sistem billing rental PlayStation: timer realtime per unit, paket jam dengan harga
berbeda per tipe konsol (PS3/PS4/PS5), penambahan waktu di tengah sesi, dan
dashboard status semua unit (kosong / dipakai / hampir habis).

## Cara Menjalankan

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Buka http://localhost:5000. Database SQLite dibuat otomatis dan di-seed saat
pertama dijalankan.

## Struktur

```
├── PRD.md
├── DESIGN.md
├── requirements.txt
├── app.py                  # Flask app + registrasi blueprint/routes
├── billing/
│   ├── __init__.py
│   ├── db.py               # koneksi SQLite, init schema + seed
│   ├── schema.sql
│   ├── seed.sql
│   ├── pricing.py          # aturan billing (prorata, pembulatan)
│   └── api.py              # endpoint REST
├── static/
│   ├── style.css
│   └── app.js              # dashboard realtime
└── templates/
    └── index.html
```

## API

- `GET /api/units` — semua unit + status + sesi aktif (sisa detik)
- `GET /api/console-types`, `GET /api/packages?console_type_id=`
- `POST /api/sessions/start` — `{unit_id, package_id, nama_pelanggan}`
- `POST /api/sessions/<id>/add-time` — `{menit}`
- `POST /api/sessions/<id>/finish`
- `GET /api/sessions/history?date=YYYY-MM-DD`
- `GET /api/reports/daily?date=YYYY-MM-DD`
- CRUD: `/api/console-types`, `/api/packages`, `/api/units`
