CREATE TABLE IF NOT EXISTS console_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  tarif_per_jam INTEGER NOT NULL CHECK (tarif_per_jam > 0)
);

CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  console_type_id INTEGER NOT NULL REFERENCES console_types(id),
  nama TEXT NOT NULL,
  durasi_menit INTEGER NOT NULL CHECK (durasi_menit > 0),
  harga INTEGER NOT NULL CHECK (harga > 0)
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  console_type_id INTEGER NOT NULL REFERENCES console_types(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL REFERENCES units(id),
  package_id INTEGER NOT NULL REFERENCES packages(id),
  nama_pelanggan TEXT NOT NULL,
  mulai TEXT NOT NULL,
  selesai_rencana TEXT NOT NULL,
  menit_tambahan INTEGER NOT NULL DEFAULT 0,
  selesai_aktual TEXT,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','selesai')),
  total_harga INTEGER NOT NULL CHECK (total_harga >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sessions_unit_status
  ON sessions(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_mulai
  ON sessions(mulai);
