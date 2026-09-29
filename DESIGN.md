# DESIGN.md — Dashboard Billing Rental PlayStation

## Pekerjaan layar

Operator rental memantau semua unit sekilas dan mengontrol sesi
(mulai / tambah waktu / selesaikan). Grid kartu unit ADALAH kontennya —
bukan template generik.

## Struktur

1. **Header**: nama aplikasi, jam berjalan, ringkasan
   ("3 dipakai · 5 kosong", "pendapatan hari ini Rp…").
2. **Grid kartu unit** (satu kartu = satu unit):
   - Kosong: nama unit besar, tipe konsol, tombol "Mulai Sesi".
   - Dipakai: badge status, timer mundur besar (HH:MM:SS), nama pelanggan,
     paket, total tagihan berjalan, tombol +15/+30/+60 dan "Selesaikan".
   - Hampir habis (sisa ≤ 10 menit): kartu berbingkai merah + badge teks —
     tanpa animasi loop.
3. **Modal** hanya untuk dua aksi: mulai sesi (pilih paket + nama pelanggan)
   dan struk selesai. Tidak ada navigasi mati: F3 hanya berisi dashboard;
   halaman Master Data & Laporan menyusul di F4.

## Palet (satu aksen, tema terang)

- Base: `#fafaf9`, teks `#1c1917`, garis `#e7e5e4`.
- Aksen utama: amber tua `#b45309` untuk tombol aksi primer.
  Alasan: hangat dan "ritel/hospitality", bukan biru teknologi generik.
- Warna status = semantik, bukan dekorasi:
  kosong `#15803d` (hijau), dipakai `#1d4ed8` (biru),
  hampir habis `#dc2626` (merah).
- Tanpa gradient, glow, glassmorphism, emoji.

## Tipografi & komponen

- System font stack (dashboard operasional internal, bukan marketing).
- Timer memakai angka tabular monospace agar tidak bergeser tiap detik.
- Radius 8px konsisten; shadow hanya pada modal.

## Data & state

- Semua angka dari API (`/api/units/status`, `/api/reports/daily`).
- Timer dihitung client tiap detik dari `selesai_rencana` server;
  sinkronisasi status via polling 5 detik.
- State kosong/error: jika API gagal, tampilkan pesan + tombol "Coba lagi"
  (bukan spinner tanpa akhir).

## Dials

- RHYTHM: 1 — satu pola kartu diulang (grid operasional memang repetitif;
  variasinya ada pada status, bukan komposisi).
- MOTION: 1 — tanpa animasi; timer sekadar berganti angka.
