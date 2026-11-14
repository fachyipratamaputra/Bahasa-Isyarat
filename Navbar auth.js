// ============================================================
// NAVBAR AUTH SIGNBRIDGE
// Mengatur avatar (.avatar) di navbar semua halaman:
//   - sudah login  -> tampilkan foto profil user
//   - belum login  -> avatar disembunyikan
// Pasang SETELAH auth-gate.js:
//   <script src="../auth-gate.js"></script>
//   <script src="../navbar-auth.js"></script>
// ============================================================
(function () {
    'use strict';

    var TOKEN_KEY = 'signbridge_token';
    var USER_KEY  = 'signbridge_user';

    // Alamat folder utama (tempat file ini berada), supaya path foto default selalu benar
    var script = document.currentScript || document.querySelector('script[src*="navbar-auth.js"]');
    var base = new URL('./', script ? script.src : location.href);
    var DEFAULT_PHOTO = new URL('assets/avatar.png', base).href;

    // Pakai pengecekan dari auth-gate.js supaya hasilnya selalu sama
    function isLoggedIn() {
        if (window.SignBridgeAuth && typeof window.SignBridgeAuth.isLoggedIn === 'function') {
            return window.SignBridgeAuth.isLoggedIn();
        }
        try {
            var token = localStorage.getItem(TOKEN_KEY);
            if (!token) return false;
            var parts = token.split('.');
            if (parts.length !== 3) return true;
            var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            return !(payload.exp && payload.exp * 1000 < Date.now());
        } catch (e) {
            return false;
        }
    }

    function getUser() {
        try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
        catch (e) { return null; }
    }

    function init() {
        var avatars = document.querySelectorAll('.nav-links .avatar');
        if (!avatars.length) return;

        // Belum login: tidak ada foto profil
        if (!isLoggedIn()) {
            avatars.forEach(function (el) { el.style.display = 'none'; });
            return;
        }

        var user  = getUser() || {};
        var name  = user.nama || user.name || user.username ||
                    (user.email ? user.email.split('@')[0] : 'Pengguna');
        var photo = user.foto || user.photo || user.avatar || DEFAULT_PHOTO;
        var initial = name.trim().charAt(0).toUpperCase() || '?';

        avatars.forEach(function (el) {
            el.style.display = '';
            el.title = name;
            el.addEventListener('click', function (e) { e.preventDefault(); });

            var img = el.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                el.appendChild(img);
            }
            img.alt = 'Foto profil ' + name;

            // Kalau foto tidak ada / gagal dimuat, tampilkan huruf pertama nama
            img.onerror = function () {
                img.remove();
                el.textContent = initial;
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.fontWeight = '800';
                el.style.color = '#7B52C8';
                el.style.background = '#fff';
            };
            img.src = photo;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();