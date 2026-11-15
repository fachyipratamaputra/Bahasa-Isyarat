// ============================================
// DASHBOARD SIGNBRIDGE
// Ubah isi DATA di bawah ini (atau isi dari backend/Ionic kamu nanti).
// Nama tidak perlu diisi manual: otomatis diambil dari akun yang login.
// ============================================
const DATA = {
    nama: '',            // dikosongkan, diisi otomatis dari akun login
    persen: 75,          // progres belajar (0-100)
    totalModul: 10,
    babBerikutnya: 3,    // "Mulai Bab 3"
    streak: 3,           // jumlah hari berturut-turut
    achievement: 'Menyelesaikan 3 Modul tanpa kesalahan.'
};

const CIRCUMFERENCE = 2 * Math.PI * 48; // keliling lingkaran r=48

const $ = id => document.getElementById(id);

// ---------- Ambil nama dari akun yang login ----------
function pickName(obj) {
    if (!obj || typeof obj !== 'object') return '';
    const n = obj.nama || obj.name || obj.username || obj.nama_pengguna || '';
    if (n) return n;
    // Kadang data user dibungkus di dalam properti "user"
    return obj.user ? pickName(obj.user) : '';
}

function parseJSON(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
}

function decodeJWT(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(escape(atob(payload))));
    } catch (e) {
        return null;
    }
}

function getLoggedInName() {
    const stores = [localStorage, sessionStorage];

    // 1) Cek key umum yang biasa dipakai untuk menyimpan data user
    const userKeys = ['user', 'currentUser', 'userData', 'signbridge_user', 'signbridgeUser'];
    for (const store of stores) {
        for (const k of userKeys) {
            const name = pickName(parseJSON(store.getItem(k)));
            if (name) return name;
        }
    }

    // 2) Cek token JWT
    const tokenKeys = ['token', 'jwt', 'access_token', 'signbridge_token', 'authToken'];
    for (const store of stores) {
        for (const k of tokenKeys) {
            const t = store.getItem(k);
            if (t) {
                const name = pickName(decodeJWT(t));
                if (name) return name;
            }
        }
    }

    // 3) Cadangan: pindai semua isi storage, cari yang berisi nama atau JWT
    for (const store of stores) {
        for (let i = 0; i < store.length; i++) {
            const val = store.getItem(store.key(i));
            if (!val) continue;
            const name = pickName(parseJSON(val)) || pickName(decodeJWT(val));
            if (name) return name;
        }
    }

    return '';
}

function render() {
    DATA.nama = getLoggedInName() || DATA.nama || 'Pengguna';

    $('userName').textContent = DATA.nama.toUpperCase();
    $('totalModul').textContent = DATA.totalModul;
    $('babNo').textContent = DATA.babBerikutnya;
    $('streak').textContent = DATA.streak;
    $('achievementText').textContent = DATA.achievement;

    animateProgress(DATA.persen);
}

// Animasi cincin progres + angka naik dari 0
function animateProgress(target) {
    const ring = $('ring');
    const text = $('percent');
    const value = Math.min(Math.max(target, 0), 100);

    ring.style.strokeDasharray = CIRCUMFERENCE;
    ring.style.strokeDashoffset = CIRCUMFERENCE;

    // Jalankan di frame berikutnya supaya transisi CSS terpicu
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - value / 100);
        });
    });

    const duration = 1400;
    const startTime = performance.now();
    function tick(now) {
        const t = Math.min((now - startTime) / duration, 1);
        text.textContent = Math.round(value * t);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

render();