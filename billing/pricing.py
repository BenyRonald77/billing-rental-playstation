"""Aturan billing rental PlayStation.

- Sesi dimulai dengan paket: harga flat sesuai harga paket (bayar di muka).
- Tambah waktu: prorata dari tarif per jam tipe konsol,
  dibulatkan ke atas ke kelipatan Rp500.
- Selesai lebih awal: tidak ada refund (paket flat).
"""
import math

PEMBULATAN = 500
BATAS_HAMPIR_HABIS_MENIT = 10


def biaya_tambahan(tarif_per_jam: int, menit: int) -> int:
    """Biaya tambah waktu (menit), prorata dan dibulatkan ke atas ke Rp500."""
    if menit <= 0:
        raise ValueError("menit harus positif")
    mentah = tarif_per_jam * menit / 60
    return math.ceil(mentah / PEMBULATAN) * PEMBULATAN


def format_rupiah(n: int) -> str:
    return "Rp" + f"{int(n):,}".replace(",", ".")
