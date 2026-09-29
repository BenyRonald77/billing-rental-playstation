# PRD — Billing Rental PlayStation

Sistem billing untuk rental PlayStation: timer realtime per unit, paket jam dengan
harga berbeda per tipe konsol, penambahan waktu di tengah sesi, dan dashboard
status semua unit.

## Tujuan

Operator rental bisa melihat status semua unit sekilas (kosong / dipakai /
hampir habis), memulai sesi dengan paket yang sesuai tipe konsol, menambah waktu
di tengah jalan, dan menyelesaikan sesi dengan total tagihan yang benar.

## Stack

- Backend: Python + Flask, SQLite (stdlib `sqlite3`, tanpa ORM)
- Frontend: satu halaman HTML + vanilla JS + CSS murni (tanpa build step)
- Timer: server sebagai source of truth (`end_time`); client menghitung mundur
  tiap detik dari `end_time` server. Status disinkron via polling `/api/units`.

## Model Data

- `console_types`: id, nama (PS3/PS4/PS5), tarif_per_jam (rupiah)
- `packages`: id, console_type_id, nama ("1 Jam", "3 Jam", ...), durasi_menit, harga
- `units`: id, nama ("PS5-01"), console_type_id
- `sessions`: id, unit_id, package_id, nama_pelanggan, mulai, selesai_rencana,
  menit_tambahan, selesai_aktual, status (aktif/selesai), total_harga

Status unit dihitung, bukan disimpan: `kosong` (tanpa sesi aktif),
`dipakai` (sesi aktif, sisa > 10 menit), `hampir_habis` (sisa ≤ 10 menit).

## Aturan Billing

1. Sesi dimulai dengan memilih paket sesuai tipe konsol unit. Harga = harga paket
   (bayar di muka, flat).
2. Tambah waktu di tengah sesi: `end_time` diperpanjang, biaya tambahan dihitung
   prorata dari tarif per jam tipe konsol, dibulatkan ke atas ke kelipatan Rp500.
3. Selesai lebih awal: tidak ada refund (paket bersifat flat). Dicatat di struk.
4. Satu unit hanya boleh punya satu sesi aktif.

## Tahap Pengerjaan

- **F0 — Fondasi**: PRD, README, struktur direktori, requirements, .gitignore.
- **F1 — Database + API master data**: schema SQLite, seed (3 tipe konsol,
  paket per tipe, 8 unit), endpoint CRUD console-types/packages/units.
- **F2 — Session lifecycle + billing**: endpoint mulai/tambah-waktu/selesai,
  perhitungan tarif, validasi (unit sibuk, paket sesuai tipe konsol).
- **F3 — Dashboard realtime**: grid kartu unit dengan timer mundur tiap detik,
  badge status, modal mulai sesi, tombol tambah waktu & selesaikan.
- **F4 — Master data UI + laporan**: halaman CRUD tipe konsol/paket/unit,
  laporan pendapatan harian + riwayat sesi.

## Kriteria Selesai

- [ ] Timer tiap unit berjalan realtime dan akurat terhadap `end_time` server
- [ ] Harga paket berbeda per tipe konsol; tambah waktu prorata terhitung benar
- [ ] Dashboard menampilkan status kosong/dipakai/hampir_habis dengan benar
- [ ] Validasi: unit sibuk tidak bisa dimulai, paket harus sesuai tipe konsol
- [ ] Laporan harian menampilkan total pendapatan
- [ ] `pip install -r requirements.txt && python app.py` langsung jalan dengan data seed

## Non-tujuan

- Multi-cabang, multi-user login/roles, payment gateway, struk printer fisik.
