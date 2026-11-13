"""Membuat tabel di PostgreSQL tanpa perlu psql.  Pakai:  python init_db.py"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
if not url:
    raise SystemExit("DATABASE_URL belum diisi di file .env")

with open(os.path.join(os.path.dirname(__file__), "database.sql"), encoding="utf-8") as f:
    sql = f.read()

conn = psycopg2.connect(url)
try:
    with conn, conn.cursor() as cur:   # 'with conn' = commit otomatis
        cur.execute(sql)
    print("Tabel users siap dipakai.")
finally:
    conn.close()
