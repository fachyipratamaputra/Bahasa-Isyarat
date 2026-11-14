// ============================================================
// AUTH GATE SIGNBRIDGE
// Mengunci fitur yang butuh login (AI Penerjemah & Kuis).
// Kalau belum login -> muncul popup "Fitur Terkunci" dengan
// tombol Masuk / Daftar. Setelah login, user dikembalikan ke
// halaman yang tadi ingin dibuka.
//
// Cara pakai: cukup pasang 1 baris di tiap halaman terkait
//   index.html            ->  <script src="auth-gate.js"></script>
//   halaman dalam folder  ->  <script src="../auth-gate.js"></script>
//
// CSS popup sudah ada di dalam file ini (tidak perlu file CSS).
// ============================================================
(function () {
    'use strict';

    var TOKEN_KEY = 'signbridge_token';   // sama dengan yang disimpan Login.js
    var USER_KEY  = 'signbridge_user';
    var AFTER_KEY = 'signbridge_after_login';

    // Cari alamat file ini supaya link ke Login/Daftar benar dari folder mana pun
    var script = document.currentScript || document.querySelector('script[src*="auth-gate.js"]');
    var base = new URL('./', script ? script.src : location.href);
    var LOGIN_URL  = new URL('Login/Login.html', base).href;
    var SIGNUP_URL = new URL('login2/login2.html', base).href;
    var HOME_URL   = new URL('index.html', base).href;

    // ------------------------------------------------------------
    // DAFTAR FITUR YANG DIKUNCI
    // Tambah baris baru di sini kalau nanti ada fitur lain yang
    // ingin dikunci. 'match' dicocokkan ke alamat halaman tujuan.
    // ------------------------------------------------------------
    var LOCKED = [
        { match: /\/penerjemah\//i, name: 'AI Penerjemah' },
        { match: /\/pelatihan\d*\//i, name: 'Kuis Pengetahuan' }
    ];

    function findLocked(url) {
        for (var i = 0; i < LOCKED.length; i++) {
            if (LOCKED[i].match.test(url)) return LOCKED[i];
        }
        return null;
    }

    // ------------------------------------------------------------
    // Cek login: token ada dan belum kedaluwarsa
    // ------------------------------------------------------------
    function isLoggedIn() {
        try {
            var token = localStorage.getItem(TOKEN_KEY);
            if (!token) return false;
            var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    function logout() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } catch (e) { /* abaikan */ }
    }

    // ------------------------------------------------------------
    // Tampilan popup (CSS disuntik dari sini)
    // ------------------------------------------------------------
    var CSS = '' +
        '.sbgate{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;' +
        'padding:20px;background:rgba(26,18,51,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);' +
        'font-family:"Poppins","Inter",system-ui,sans-serif}' +
        '.sbgate.open{display:flex;animation:sbgFade .2s ease}' +
        '.sbgate-box{position:relative;width:100%;max-width:380px;background:#fff;border-radius:28px;' +
        'padding:34px 28px 22px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);animation:sbgPop .28s cubic-bezier(.2,1.2,.4,1)}' +
        '.sbgate-x{position:absolute;top:12px;right:14px;width:34px;height:34px;border:0;border-radius:50%;' +
        'background:#F1ECFA;color:#2B1A7C;font-size:22px;line-height:1;cursor:pointer}' +
        '.sbgate-x:hover{background:#E4DAF5}' +
        '.sbgate-lock{width:84px;height:84px;margin:0 auto 14px;border-radius:50%;background:#CDE53D;' +
        'display:flex;align-items:center;justify-content:center;box-shadow:0 8px 0 #2B1A7C}' +
        '.sbgate-lock svg{width:42px;height:42px}' +
        '.sbgate h3{margin:14px 0 8px;font-size:22px;font-weight:800;color:#2B1A7C}' +
        '.sbgate-text{margin:0 0 20px;font-size:14px;line-height:1.55;color:#4a4560}' +
        '.sbgate-text b{color:#7B52C8}' +
        '.sbgate-btns{display:flex;flex-direction:column;gap:10px}' +
        '.sbgate-btn{display:block;padding:13px 18px;border-radius:999px;border:2.5px solid #2B1A7C;' +
        'background:#fff;color:#2B1A7C;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer;' +
        'transition:transform .12s ease,box-shadow .12s ease}' +
        '.sbgate-btn.primary{background:#CDE53D;box-shadow:0 4px 0 #2B1A7C}' +
        '.sbgate-btn:hover{transform:translateY(-2px)}' +
        '.sbgate-btn:active{transform:translateY(1px)}' +
        '.sbgate-later{margin-top:14px;border:0;background:none;color:#7a7590;font:600 13px "Poppins",sans-serif;cursor:pointer}' +
        '.sbgate-later:hover{color:#2B1A7C;text-decoration:underline}' +
        '@keyframes sbgFade{from{opacity:0}to{opacity:1}}' +
        '@keyframes sbgPop{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}' +
        '@media (prefers-reduced-motion:reduce){.sbgate.open,.sbgate-box{animation:none}}';

    var LOCK_SVG =
        '<svg viewBox="0 0 24 24" fill="none" stroke="#2B1A7C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="#fff"/>' +
        '<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="#2B1A7C"/></svg>';

    var overlay, textEl, loginBtn, signupBtn, laterBtn, closeBtn;
    var currentTarget = null, blocking = false, lastFocus = null;

    function build() {
        if (overlay) return;

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        overlay = document.createElement('div');
        overlay.className = 'sbgate';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'sbgateTitle');
        overlay.innerHTML =
            '<div class="sbgate-box">' +
                '<button type="button" class="sbgate-x" aria-label="Tutup">&times;</button>' +
                '<div class="sbgate-lock" aria-hidden="true">' + LOCK_SVG + '</div>' +
                '<h3 id="sbgateTitle">Fitur Terkunci</h3>' +
                '<p class="sbgate-text"></p>' +
                '<div class="sbgate-btns">' +
                    '<a class="sbgate-btn primary" data-act="login">Masuk</a>' +
                    '<a class="sbgate-btn" data-act="signup">Daftar</a>' +
                '</div>' +
                '<button type="button" class="sbgate-later">Nanti saja</button>' +
            '</div>';
        document.body.appendChild(overlay);

        textEl    = overlay.querySelector('.sbgate-text');
        loginBtn  = overlay.querySelector('[data-act="login"]');
        signupBtn = overlay.querySelector('[data-act="signup"]');
        laterBtn  = overlay.querySelector('.sbgate-later');
        closeBtn  = overlay.querySelector('.sbgate-x');

        loginBtn.href  = LOGIN_URL;
        signupBtn.href = SIGNUP_URL;

        // Simpan halaman tujuan supaya setelah login user langsung ke sana
        [loginBtn, signupBtn].forEach(function (btn) {
            btn.addEventListener('click', function () {
                try {
                    if (currentTarget) sessionStorage.setItem(AFTER_KEY, currentTarget);
                } catch (e) { /* abaikan */ }
            });
        });

        closeBtn.addEventListener('click', function () { if (!blocking) hide(); });
        laterBtn.addEventListener('click', function () {
            if (blocking) location.href = HOME_URL; else hide();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay && !blocking) hide();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('open') && !blocking) hide();
        });
    }

    // isBlocking = true  -> popup tidak bisa ditutup (dipakai saat halaman dibuka langsung lewat alamat)
    function show(targetUrl, featureName, isBlocking) {
        build();
        currentTarget = targetUrl;
        blocking = !!isBlocking;

        textEl.innerHTML = 'Masuk atau daftar dulu untuk memakai <b></b>.';
        textEl.querySelector('b').textContent = featureName;

        closeBtn.style.display = blocking ? 'none' : '';
        laterBtn.textContent = blocking ? 'Kembali ke Beranda' : 'Nanti saja';

        lastFocus = document.activeElement;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        loginBtn.focus();
    }

    function hide() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // ------------------------------------------------------------
    // 1) Klik link ke fitur terkunci -> tahan, tampilkan popup.
    //    Pakai fase "capture" supaya jalan lebih dulu daripada
    //    script lain (mis. popup tutorial AI & tombol Next).
    // ------------------------------------------------------------
    document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a[href]') : null;
        if (!a || a.closest('.sbgate')) return;
        if (isLoggedIn()) return;

        var rule = findLocked(a.href);
        if (!rule) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        show(a.href, rule.name, false);
    }, true);

    // ------------------------------------------------------------
    // 2) Halaman terkunci dibuka langsung (ketik alamat / bookmark)
    //    -> popup muncul dan tidak bisa ditutup.
    // ------------------------------------------------------------
    function guardCurrentPage() {
        var rule = findLocked(location.href);
        if (rule && !isLoggedIn()) show(location.href, rule.name, true);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', guardCurrentPage);
    } else {
        guardCurrentPage();
    }

    // Bisa dipakai dari script lain, mis. SignBridgeAuth.isLoggedIn()
    window.SignBridgeAuth = { isLoggedIn: isLoggedIn, logout: logout };
})();