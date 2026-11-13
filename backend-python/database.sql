-- PostgreSQL. Jalankan sekali di SQL Editor (Supabase/Neon) atau: python init_db.py
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_email UNIQUE (email)
);
