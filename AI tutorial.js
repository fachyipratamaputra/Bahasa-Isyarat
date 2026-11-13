// ============================================
// POPUP TUTORIAL AI PENERJEMAH
// Klik robot -> popup tutorial -> klik Next -> pindah ke halaman AI sendiri
// File: AI-tutorial.js (dimuat di index.html)
// ============================================
(function () {
    const trigger = document.querySelector('#ai .ai-link');
    if (!trigger) return;

    // Halaman AI (tampilan sendiri)
    const AI_PAGE_URL = 'Penerjemah/Penerjemah.html';

    const modal = document.createElement('div');
    modal.className = 'aitut';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Tutorial AI Penerjemah');
    modal.innerHTML = `
        <div class="aitut-box">
            <button type="button" class="aitut-x" aria-label="Tutup">&times;</button>
            <div class="aitut-hero">
                <div class="cam"></div>
                <img src="dokumentasi/foto/Tangan_Melambai_Bergaya_Emoji-removebg-preview.png" alt="Tangan melambai" />
            </div>
            <h3>Cara Memakai AI Penerjemah</h3>
            <p>Gampang banget, cuma tiga langkah!</p>
            <ul class="aitut-list">
                <li><b>1</b>Izinkan akses kamera di browser kamu</li>
                <li><b>2</b>Arahkan tanganmu ke layar kamera</li>
                <li><b>3</b>AI akan mendeteksi gerakanmu dan menerjemahkannya</li>
            </ul>
            <div class="aitut-btns">
                <button type="button" class="aitut-btn" data-act="skip">Batal</button>
                <a href="${AI_PAGE_URL}" class="aitut-btn primary" data-act="next">Next &rsaquo;</a>
            </div>
        </div>`;
    document.body.appendChild(modal);

    let lastFocus = null;
    function open() {
        lastFocus = document.activeElement;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        modal.querySelector('[data-act="next"]').focus();
    }
    function close() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    trigger.addEventListener('click', (e) => { e.preventDefault(); open(); });
    modal.querySelector('.aitut-x').addEventListener('click', close);
    modal.querySelector('[data-act="skip"]').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
})();