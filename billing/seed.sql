-- Seed awal: 3 tipe konsol, paket per tipe, 8 unit
INSERT INTO console_types (nama, tarif_per_jam) VALUES
  ('PS3', 5000),
  ('PS4', 8000),
  ('PS5', 12000);

-- Paket PS3 (tarif 5000/jam)
INSERT INTO packages (console_type_id, nama, durasi_menit, harga) VALUES
  (1, '1 Jam',  60,  5000),
  (1, '2 Jam', 120,  9500),
  (1, '3 Jam', 180, 13500),
  (1, '5 Jam', 300, 20000);

-- Paket PS4 (tarif 8000/jam)
INSERT INTO packages (console_type_id, nama, durasi_menit, harga) VALUES
  (2, '1 Jam',  60,  8000),
  (2, '2 Jam', 120, 15000),
  (2, '3 Jam', 180, 21000),
  (2, '5 Jam', 300, 32000);

-- Paket PS5 (tarif 12000/jam)
INSERT INTO packages (console_type_id, nama, durasi_menit, harga) VALUES
  (3, '1 Jam',  60, 12000),
  (3, '2 Jam', 120, 22000),
  (3, '3 Jam', 180, 30000),
  (3, '5 Jam', 300, 45000);

INSERT INTO units (nama, console_type_id) VALUES
  ('PS3-01', 1), ('PS3-02', 1),
  ('PS4-01', 2), ('PS4-02', 2), ('PS4-03', 2),
  ('PS5-01', 3), ('PS5-02', 3), ('PS5-03', 3);
