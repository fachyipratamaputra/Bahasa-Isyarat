// ============================================================
// QUIZ EXIT SIGNBRIDGE
// Dipakai di halaman kuis (Pelatihan1 & Pelatihan2):
//  1) Menambah tombol "Kembali" di atas kuis
//  2) Kalau kuis SEDANG berjalan (sudah mulai menjawab, belum selesai)
//     dan user mau keluar -> muncul popup konfirmasi
//  3) Kalau kuis belum dimulai / sudah selesai -> keluar langsung
//
// Cara pakai: pasang 1 baris di halaman kuis (setelah auth-gate.js)
//   <script src="../quiz-exit.js"></script>
//
// Script ini hanya MEMBACA tampilan kuis, tidak mengubah Pelatihan.js
// maupun Pelatihan2.js. CSS sudah ada di dalam file ini.
// ============================================================
(function () {
    'use strict';

    var script = document.currentScript || document.querySelector('script[src*="quiz-exit.js"]');
    var base = new URL('./', script ? script.src : location.href);

    // Tombol Kembali mengarah ke halaman pelajaran asal kuis
    var isKata = /\/pelatihan2\//i.test(location.pathname);
    var BACK_URL = new URL(
        isKata ? 'Pembelajaran2/Pembelajaran2.html' : 'Pembelajaran/Pembelajaran.html',
        base
    ).href;

    var resultEl = document.getElementById('result');
    var barEl    = document.getElementById('bar');
    var leaving  = false;   // true setelah user setuju keluar (supaya tidak ditanya dua kali)

    // ------------------------------------------------------------
    // Apakah kuis sedang berjalan?
    //   - belum selesai (layar hasil masih tersembunyi), DAN
    //   - sudah melewati soal 1 atau sudah memilih/memeriksa jawaban
    // ------------------------------------------------------------
    function inProgress() {
        if (!resultEl || !barEl || !resultEl.hidden) return false;
        var pct = parseFloat(barEl.style.width) || 0;
        return pct > 6.5 ||
            !!document.querySelector('.option.selected, .option.correct, .option.wrong');
    }

    // ------------------------------------------------------------
    // Tampilan (CSS disuntik dari sini)
    // ------------------------------------------------------------
    var CSS = '' +
        '.qx-row{text-align:left;margin:0 0 18px}' +
        '.qx-back{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:999px;' +
        'border:2px solid #DCD6F5;background:#fff;color:#2B1A7C;font:700 .85rem "Inter","Poppins",sans-serif;' +
        'cursor:pointer;transition:.15s}' +
        '.qx-back:hover{border-color:#A63BD6;transform:translateX(-2px)}' +
        '.qx{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;padding:20px;' +
        'background:rgba(26,18,51,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);' +
        'font-family:"Poppins","Inter",system-ui,sans-serif;text-align:center}' +
        '.qx.open{display:flex;animation:qxFade .2s ease}' +
        '.qx-box{width:100%;max-width:360px;background:#fff;border-radius:28px;padding:30px 26px 24px;' +
        'box-shadow:0 20px 50px rgba(0,0,0,.35);animation:qxPop .28s cubic-bezier(.2,1.2,.4,1)}' +
        '.qx-ic{width:72px;height:72px;margin:0 auto 12px;border-radius:50%;background:#CDE53D;color:#2B1A7C;' +
        'display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;box-shadow:0 7px 0 #2B1A7C}' +
        '.qx h3{margin:16px 0 8px;font-size:21px;font-weight:800;color:#2B1A7C}' +
        '.qx p{margin:0 0 20px;font-size:14px;line-height:1.55;color:#4a4560}' +
        '.qx-btns{display:flex;flex-direction:column;gap:10px}' +
        '.qx-btn{padding:13px 18px;border-radius:999px;border:2.5px solid #2B1A7C;background:#fff;color:#2B1A7C;' +
        'font:700 15px "Poppins",sans-serif;cursor:pointer;transition:transform .12s ease}' +
        '.qx-btn.primary{background:#CDE53D;box-shadow:0 4px 0 #2B1A7C}' +
        '.qx-btn:hover{transform:translateY(-2px)}' +
        '@keyframes qxFade{from{opacity:0}to{opacity:1}}' +
        '@keyframes qxPop{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}' +
        '@media (prefers-reduced-motion:reduce){.qx.open,.qx-box{animation:none}}';

    var overlay = null, stayBtn = null, leaveBtn = null, dest = null, lastFocus = null;

    function build() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'qx';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'qxTitle');
        overlay.innerHTML =
            '<div class="qx-box">' +
                '<div class="qx-ic" aria-hidden="true">!</div>' +
                '<h3 id="qxTitle">Keluar dari kuis?</h3>' +
                '<p>Kuis belum selesai. Kalau keluar sekarang, progres kamu tidak akan tersimpan.</p>' +
                '<div class="qx-btns">' +
                    '<button type="button" class="qx-btn primary" data-act="stay">Lanjut Kuis</button>' +
                    '<button type="button" class="qx-btn" data-act="leave">Keluar</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        stayBtn  = overlay.querySelector('[data-act="stay"]');
        leaveBtn = overlay.querySelector('[data-act="leave"]');

        stayBtn.addEventListener('click', closePopup);
        leaveBtn.addEventListener('click', function () {
            leaving = true;
            location.href = dest;
        });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('open')) closePopup();
        });
    }

    function ask(url) {
        build();
        dest = url;
        lastFocus = document.activeElement;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        stayBtn.focus();
    }

    function closePopup() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // Keluar: kalau kuis berjalan -> tanya dulu, kalau tidak -> langsung
    function go(url) {
        if (inProgress()) {
            ask(url);
        } else {
            leaving = true;
            location.href = url;
        }
    }

    // ------------------------------------------------------------
    // Pasang tombol Kembali di atas bar progres
    // ------------------------------------------------------------
    function init() {
        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var main = document.querySelector('main.quiz');
        var progress = main && main.querySelector('.progress');
        if (main && progress) {
            var row = document.createElement('div');
            row.className = 'qx-row';
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'qx-back';
            btn.innerHTML = '&lsaquo; Kembali';
            btn.addEventListener('click', function () { go(BACK_URL); });
            row.appendChild(btn);
            main.insertBefore(row, progress);
        }

        // Link lain di halaman (navbar, logo) juga ditanya kalau kuis berjalan
        document.addEventListener('click', function (e) {
            var a = e.target.closest ? e.target.closest('a[href]') : null;
            if (!a || a.closest('.qx')) return;
            var href = a.getAttribute('href');
            if (!href || href.charAt(0) === '#') return;
            if (!inProgress()) return;
            e.preventDefault();
            e.stopPropagation();
            ask(a.href);
        }, true);

        // Tutup tab / refresh / tombol back browser: pakai peringatan bawaan browser
        window.addEventListener('beforeunload', function (e) {
            if (leaving || !inProgress()) return;
            e.preventDefault();
            e.returnValue = '';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();