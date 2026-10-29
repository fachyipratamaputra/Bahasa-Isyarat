// ============================================
// ALFABET BISINDO - 9 huruf per halaman (A-I, J-R, S-Z)
// Gambar: ../assets/alfabet/a.png, b.png, ... z.png
// ============================================
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PER_PAGE = 9;
const TOTAL_PAGES = Math.ceil(LETTERS.length / PER_PAGE);

const grid     = document.getElementById('grid');
const backBtn  = document.getElementById('backBtn');
const nextBtn  = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

// Halaman diambil dari URL (?page=2) supaya tombol refresh/back browser tetap aman
let page = parseInt(new URLSearchParams(location.search).get('page'), 10) || 1;
page = Math.min(Math.max(page, 1), TOTAL_PAGES);

function render() {
    const start = (page - 1) * PER_PAGE;
    const items = LETTERS.slice(start, start + PER_PAGE);

    grid.innerHTML = '';
    items.forEach(ch => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'letter-card';
        card.setAttribute('aria-label', 'Huruf ' + ch);
        card.innerHTML =
            '<div class="letter-img"><img src="../assets/alfabet/' + ch.toLowerCase() + '.png" alt="Isyarat huruf ' + ch + '" /></div>' +
            '<span class="letter-char">' + ch + '</span>';
        grid.appendChild(card);
    });

    pageInfo.textContent = 'Halaman ' + page + ' / ' + TOTAL_PAGES;

    // Back: halaman pertama kembali ke beranda
    if (page === 1) {
        backBtn.href = '../index.html';
        backBtn.textContent = '\u2039 Back';
    } else {
        backBtn.href = '#';
    }

    // Next: halaman terakhir lanjut ke kuis
    if (page === TOTAL_PAGES) {
        nextBtn.href = '../Pelatihan1/Pelatihan.html';
        nextBtn.textContent = 'Kuis \u203A';
    } else {
        nextBtn.href = '#';
        nextBtn.textContent = 'Next \u203A';
    }
}

backBtn.addEventListener('click', e => {
    if (page > 1) {
        e.preventDefault();
        page--;
        history.replaceState(null, '', '?page=' + page);
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

nextBtn.addEventListener('click', e => {
    if (page < TOTAL_PAGES) {
        e.preventDefault();
        page++;
        history.replaceState(null, '', '?page=' + page);
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

render();