import os
import re
import sys
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    sys.exit("JWT_SECRET belum diisi. Salin .env.example menjadi .env lalu isi.")

JWT_EXPIRES_DAYS = int(os.getenv("JWT_EXPIRES_DAYS", "7"))
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

app = Flask(__name__)

# Token dikirim lewat header (bukan cookie), jadi aman mengizinkan frontend
# dari Live Server (5500), XAMPP Apache (80), atau file:// saat development.
CORS(app)

# Batasi percobaan login/register: 10x per 15 menit per IP
limiter = Limiter(get_remote_address, app=app, default_limits=[], storage_uri="memory://")
AUTH_LIMIT = "10 per 15 minutes"


def get_db():
    """Buat koneksi baru ke MySQL XAMPP."""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "signbridge"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def make_token(user):
    payload = {
        "id": user["id"],
        "nama": user["nama"],
        "email": user["email"],
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def require_auth(f):
    """Decorator: route butuh header 'Authorization: Bearer <token>'."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify(message="Silakan masuk terlebih dahulu."), 401
        try:
            request.user = jwt.decode(header[7:], JWT_SECRET, algorithms=["HS256"])
        except jwt.PyJWTError:
            return jsonify(message="Sesi berakhir, silakan masuk lagi."), 401
        return f(*args, **kwargs)
    return wrapper


@app.get("/api/health")
def health():
    return jsonify(status="ok")


# POST /api/register  { nama, email, password }
@app.post("/api/register")
@limiter.limit(AUTH_LIMIT)
def register():
    data = request.get_json(silent=True) or {}
    nama = str(data.get("nama", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not nama or not email or not password:
        return jsonify(message="Semua kolom wajib diisi."), 400
    if len(nama) < 3:
        return jsonify(message="Nama pengguna minimal 3 karakter."), 400
    if not EMAIL_RE.match(email):
        return jsonify(message="Format email belum benar."), 400
    if len(password) < 6:
        return jsonify(message="Password minimal 6 karakter."), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return jsonify(message="Email sudah terdaftar."), 409

            cur.execute(
                "INSERT INTO users (nama, email, password_hash) VALUES (%s, %s, %s)",
                (nama, email, generate_password_hash(password)),
            )
        conn.commit()
    except pymysql.err.IntegrityError:  # email dobel (balapan dua request)
        return jsonify(message="Email sudah terdaftar."), 409
    finally:
        conn.close()

    return jsonify(message="Pendaftaran berhasil! Silakan masuk."), 201


# POST /api/login  { email, password }
@app.post("/api/login")
@limiter.limit(AUTH_LIMIT)
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify(message="Email dan password wajib diisi."), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, nama, email, password_hash FROM users WHERE email = %s",
                (email,),
            )
            user = cur.fetchone()
    finally:
        conn.close()

    # Pesan sama untuk "email tidak ada" & "password salah" supaya akun tidak bisa ditebak
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify(message="Email atau password salah."), 401

    return jsonify(
        message="Berhasil masuk!",
        token=make_token(user),
        user={"id": user["id"], "nama": user["nama"], "email": user["email"]},
    )


# GET /api/me  (butuh token) -> data user yang sedang login
@app.get("/api/me")
@require_auth
def me():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, nama, email, created_at FROM users WHERE id = %s",
                (request.user["id"],),
            )
            user = cur.fetchone()
    finally:
        conn.close()

    if not user:
        return jsonify(message="Pengguna tidak ditemukan."), 404
    user["created_at"] = user["created_at"].isoformat()
    return jsonify(user=user)


@app.errorhandler(404)
def not_found(_):
    return jsonify(message="Endpoint tidak ditemukan."), 404


@app.errorhandler(pymysql.err.OperationalError)
def db_down(err):
    print("Gagal konek database:", err)
    return jsonify(message="Database tidak bisa dihubungi. Pastikan MySQL XAMPP sudah Start."), 500


@app.errorhandler(500)
def server_error(_):
    return jsonify(message="Terjadi kesalahan pada server."), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    print(f"Server jalan di http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
