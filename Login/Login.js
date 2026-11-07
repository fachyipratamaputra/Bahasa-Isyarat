// ============================================
// LOGIN SIGNBRIDGE
// Terhubung ke backend Node.js (lihat folder backend/).
// ============================================
const form       = document.getElementById('loginForm');
const emailEl    = document.getElementById('email');
const passEl     = document.getElementById('password');
const rememberEl = document.getElementById('remember');
const messageEl  = document.getElementById('message');
const submitBtn  = form.querySelector('.btn-submit');

const API_URL     = 'http://localhost:3000/api'; // alamat backend
const REDIRECT_TO = '../index.html'; // halaman tujuan setelah berhasil
// Isi otomatis email jika sebelumnya dicentang "Remember me"
try {
    const saved = localStorage.getItem('signbridge_email');
    if (saved) {
        emailEl.value = saved;
        rememberEl.checked = true;
    }
} catch (e) { /* localStorage tidak tersedia, abaikan */ }

function showMessage(text, ok) {
    messageEl.textContent = text;
    messageEl.classList.toggle('ok', !!ok);
}

function setInvalid(input, bad) {
    input.closest('.field').classList.toggle('invalid', bad);
}

// Hapus tanda galat saat pengguna mengetik lagi
[emailEl, passEl].forEach(input => {
    input.addEventListener('input', () => {
        setInvalid(input, false);
        showMessage('');
    });
});

function validate() {
    const email = emailEl.value.trim();
    const pass  = passEl.value;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    setInvalid(emailEl, !emailOk);
    setInvalid(passEl, pass.length < 6);

    if (!email || !pass) {
        showMessage('Email dan password wajib diisi.');
        return false;
    }
    if (!emailOk) {
        showMessage('Format email belum benar.');
        return false;
    }
    if (pass.length < 6) {
        showMessage('Password minimal 6 karakter.');
        return false;
    }
    return true;
}

// Kirim email & password ke backend, simpan token jika berhasil
async function doLogin(email, password) {
    let res;
    try {
        res = await fetch(API_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    } catch (err) {
        throw new Error('Tidak bisa terhubung ke server. Pastikan backend sudah jalan.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal masuk, coba lagi.');

    localStorage.setItem('signbridge_token', data.token);
    localStorage.setItem('signbridge_user', JSON.stringify(data.user));
    return data;
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;

    const email = emailEl.value.trim();
    submitBtn.disabled = true;
    showMessage('Memproses...', true);

    try {
        await doLogin(email, passEl.value);

        try {
            if (rememberEl.checked) localStorage.setItem('signbridge_email', email);
            else localStorage.removeItem('signbridge_email');
        } catch (err) { /* abaikan */ }

        showMessage('Berhasil masuk!', true);
        setTimeout(() => { location.href = REDIRECT_TO; }, 500);
    } catch (err) {
        showMessage(err.message || 'Gagal masuk, coba lagi.');
        submitBtn.disabled = false;
    }
});

// Tombol sosial dan lupa password (belum tersambung)
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showMessage('Login dengan ' + btn.dataset.provider + ' belum tersedia.');
    });
});
document.getElementById('forgotLink').addEventListener('click', e => {
    e.preventDefault();
    showMessage('Fitur reset password belum tersedia.');
});