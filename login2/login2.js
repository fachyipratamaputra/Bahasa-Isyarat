// ============================================
// SIGN UP SIGNBRIDGE
// Catatan: ini validasi di sisi tampilan saja (belum menyimpan ke server).
// Untuk pendaftaran sungguhan, sambungkan di fungsi doRegister() ke API/Ionic kamu.
// ============================================
const form       = document.getElementById('signupForm');
const namaEl     = document.getElementById('nama');
const emailEl    = document.getElementById('email');
const passEl     = document.getElementById('password');
const rememberEl = document.getElementById('remember');
const messageEl  = document.getElementById('message');
const submitBtn  = form.querySelector('.btn-submit');

const REDIRECT_TO = '../Login/Login.html'; // halaman tujuan setelah berhasil daftar

function showMessage(text, ok) {
    messageEl.textContent = text;
    messageEl.classList.toggle('ok', !!ok);
}

function setInvalid(input, bad) {
    input.closest('.field').classList.toggle('invalid', bad);
}

// Hapus tanda galat saat pengguna mengetik lagi
[namaEl, emailEl, passEl].forEach(input => {
    input.addEventListener('input', () => {
        setInvalid(input, false);
        showMessage('');
    });
});

function validate() {
    const nama  = namaEl.value.trim();
    const email = emailEl.value.trim();
    const pass  = passEl.value;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    setInvalid(namaEl, nama.length < 3);
    setInvalid(emailEl, !emailOk);
    setInvalid(passEl, pass.length < 6);

    if (!nama || !email || !pass) {
        showMessage('Semua kolom wajib diisi.');
        return false;
    }
    if (nama.length < 3) {
        showMessage('Nama pengguna minimal 3 karakter.');
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

// Ganti isi fungsi ini dengan permintaan ke server kamu
async function doRegister(nama, email, password) {
    // Contoh:
    // const res = await fetch('https://alamat-api-kamu/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ nama, email, password })
    // });
    // if (!res.ok) throw new Error('Pendaftaran gagal, email mungkin sudah dipakai.');
    // return res.json();
    return new Promise(resolve => setTimeout(resolve, 600)); // simulasi
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;

    const nama  = namaEl.value.trim();
    const email = emailEl.value.trim();
    submitBtn.disabled = true;
    showMessage('Memproses...', true);

    try {
        await doRegister(nama, email, passEl.value);

        // Jika "Remember me" dicentang, email akan terisi otomatis di halaman Login
        try {
            if (rememberEl.checked) localStorage.setItem('signbridge_email', email);
        } catch (err) { /* abaikan */ }

        showMessage('Pendaftaran berhasil! Silakan masuk.', true);
        setTimeout(() => { location.href = REDIRECT_TO; }, 800);
    } catch (err) {
        showMessage(err.message || 'Gagal mendaftar, coba lagi.');
        submitBtn.disabled = false;
    }
});

// Tombol sosial (belum tersambung)
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showMessage('Daftar dengan ' + btn.dataset.provider + ' belum tersedia.');
    });
});