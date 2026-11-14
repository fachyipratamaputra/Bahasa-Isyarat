// ============================================
// STATUS LOGIN DI INDEX
// Kalau sudah login (token ada di localStorage):
//   - tombol "Sign In" diganti foto profil (+ menu nama & Keluar)
//   - tombol "Mulai" di hero disembunyikan
// Kunci yang dibaca sama dengan yang disimpan Login.js:
//   signbridge_token, signbridge_user
// ============================================
(function () {
    let token = null, user = null;
    try {
        token = localStorage.getItem('signbridge_token');
        user = JSON.parse(localStorage.getItem('signbridge_user') || 'null');
    } catch (e) { /* localStorage tidak tersedia */ }

    // Dianggap login kalau token ada. Kalau token berbentuk JWT dan punya masa berlaku,
    // masa berlakunya ikut diperiksa (tidak bergantung pada auth-gate.js).
    function tokenValid(t) {
        if (!t) return false;
        try {
            const parts = t.split('.');
            if (parts.length !== 3) return true;          // bukan JWT: cukup ada saja
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            return !(payload.exp && payload.exp * 1000 < Date.now());
        } catch (e) { return true; }
    }
    console.log('[auth-nav] token ada:', !!token, '| valid:', tokenValid(token));
    if (!tokenValid(token)) return;   // belum login / token kedaluwarsa: tampilan tetap seperti biasa

    /* ---------- Tombol "Mulai" di hero ---------- */
    const mulai = document.querySelector('.hero-text a[href*="login/Login.html"]');
    if (mulai) mulai.style.display = 'none';

    /* ---------- Tombol "Sign In" -> foto profil ---------- */
    const signin = document.querySelector('.nav-links .btn-signin');
    if (!signin) return;

    const name = (user && (user.nama || user.name || user.username)) ||
                 (user && user.email ? user.email.split('@')[0] : 'Pengguna');
    const email = (user && user.email) || '';
    const photo = (user && (user.foto || user.photo || user.avatar)) || 'assets/avatar.png';
    const initial = name.trim().charAt(0).toUpperCase() || '?';

    const style = document.createElement('style');
    style.textContent = `
        .user-menu { position: relative; display: inline-block; }
        .user-avatar {
            width: 46px; height: 46px; border-radius: 50%;
            border: 3px solid #7B52C8; background: #fff; padding: 0;
            overflow: hidden; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font: 800 1.1rem 'Poppins', sans-serif; color: #7B52C8;
            transition: transform .15s;
        }
        .user-avatar:hover { transform: scale(1.06); }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .user-drop {
            position: absolute; right: 0; top: calc(100% + 10px); z-index: 150;
            min-width: 190px; padding: 12px;
            background: #fff; border: 3px solid #2B1A7C; border-radius: 16px;
            box-shadow: 4px 4px 0 #2B1A7C;
            font-family: 'Poppins', sans-serif; color: #2B1A7C;
            display: none;
        }
        .user-menu.open .user-drop { display: block; }
        .user-drop strong { display: block; font-size: .9rem; word-break: break-word; }
        .user-drop small { display: block; font-size: .7rem; opacity: .65; margin-bottom: 10px; word-break: break-all; }
        .user-drop button {
            width: 100%; border: 0; border-radius: 999px; padding: 8px 12px;
            background: #7B52C8; color: #fff; cursor: pointer;
            font: 700 .8rem 'Poppins', sans-serif;
        }
        .user-drop button:hover { background: #A63BD6; }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'user-menu';

    const avatarBtn = document.createElement('button');
    avatarBtn.type = 'button';
    avatarBtn.className = 'user-avatar';
    avatarBtn.setAttribute('aria-label', 'Menu profil');
    avatarBtn.setAttribute('aria-haspopup', 'true');

    const img = document.createElement('img');
    img.src = photo;
    img.alt = 'Foto profil ' + name;
    // Kalau foto tidak ada, tampilkan huruf pertama nama
    img.onerror = () => { img.remove(); avatarBtn.textContent = initial; };
    avatarBtn.appendChild(img);

    const drop = document.createElement('div');
    drop.className = 'user-drop';
    const strong = document.createElement('strong');
    strong.textContent = name;
    const small = document.createElement('small');
    small.textContent = email;
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.textContent = 'Keluar';
    drop.append(strong, small, logout);

    wrap.append(avatarBtn, drop);
    signin.replaceWith(wrap);

    avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        wrap.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') wrap.classList.remove('open');
    });

    logout.addEventListener('click', () => {
        try {
            localStorage.removeItem('signbridge_token');
            localStorage.removeItem('signbridge_user');
        } catch (e) { /* abaikan */ }
        location.reload();
    });
})();