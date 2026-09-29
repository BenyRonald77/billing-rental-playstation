# Billing Rental PlayStation

Sistem billing rental PlayStation: timer realtime per unit, paket jam dengan harga
berbeda per tipe konsol (PS3/PS4/PS5), penambahan waktu di tengah sesi, dan
dashboard status semua unit (kosong / dipakai / hampir habis).

Stack: Next.js 14 + TypeScript + Prisma + SQLite + Tailwind.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Buka http://localhost:3000. Database dibuat otomatis dan di-seed saat
pertama dijalankan (`npm run seed`).

## Halaman

- `/` — Dashboard: grid kartu unit dengan timer mundur realtime, badge status
  (kosong/dipakai/hampir habis), modal mulai sesi, tombol tambah waktu & selesaikan.
- `/laporan` — Laporan pendapatan harian + riwayat sesi.
- `/master` — CRUD tipe konsol, paket, dan unit.

## API

- `GET /api/units/status` — semua unit + status hitung + sesi aktif (sisa detik)
- `GET /api/console-types`, `POST /api/console-types`, `PUT/DELETE /api/console-types/[id]`
- `GET /api/packages?console_type_id=`, `POST /api/packages`, `PUT/DELETE /api/packages/[id]`
- `GET /api/units`, `POST /api/units`, `PUT/DELETE /api/units/[id]`
- `POST /api/sessions/start` — `{unit_id, package_id, nama_pelanggan}`
- `POST /api/sessions/[id]/add-time` — `{menit}`
- `POST /api/sessions/[id]/finish`
- `GET /api/sessions/history?date=YYYY-MM-DD`
- `GET /api/reports/daily?date=YYYY-MM-DD`

## Aturan Billing

- Sesi dimulai dengan paket: harga flat sesuai harga paket (bayar di muka).
- Tambah waktu: prorata dari tarif per jam tipe konsol, dibulatkan ke atas ke
  kelipatan Rp500.
- Selesai lebih awal: tidak ada refund (paket bersifat flat).
- Satu unit hanya boleh punya satu sesi aktif.
- Server adalah source of truth untuk timer (`selesai_rencana`); client
  menghitung mundur tiap detik.
