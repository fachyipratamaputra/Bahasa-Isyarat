// ============================================
// BAHASA SEHARI-HARI BISINDO - 6 kata per halaman
// Gambar: ../dokumentasi/foto/Sehari hari/<Nama>.png
// Mau tambah kata? Cukup tambah baris di WORDS, halaman otomatis bertambah.
// ============================================
const IMG_DIR = '../dokumentasi/foto/Sehari hari/';

const WORDS = [
    { text: 'Rumah',     file: 'Rumah.png' },
    { text: 'Kerja',     file: 'Kerja.png' },
    { text: 'Pulang',    file: 'Pulang.png' },
    { text: 'Sekolah',   file: 'Sekolah.png' },
    { text: 'Hati-hati', file: 'Hati Hati.png' },   // nama file asli pakai spasi
    { text: 'Umur',      file: 'Umur.png' }
];

const PER_PAGE = 6;
const TOTAL_PAGES = Math.ceil(WORDS.length / PER_PAGE);

const grid    = document.getElementById('grid');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');

// Halaman diambil dari URL (?page=2)
let page = parseInt(new URLSearchParams(location.search).get('page'), 10) || 1;
page = Math.min(Math.max(page, 1), TOTAL_PAGES);

function render() {
    const start = (page - 1) * PER_PAGE;
    const items = WORDS.slice(start, start + PER_PAGE);

    grid.innerHTML = '';
    items.forEach(w => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'word-card';
        card.setAttribute('aria-label', w.text);

        const imgBox = document.createElement('div');
        imgBox.className = 'word-img';
        const img = document.createElement('img');
        // encodeURI supaya spasi di nama folder/file ("Sehari hari", "Hati Hati.png") terbaca benar
        img.src = encodeURI(IMG_DIR + w.file);
        img.alt = 'Isyarat ' + w.text;
        img.onerror = () => {
            console.warn('Gambar tidak ditemukan:', img.src);
            img.style.display = 'none';
            imgBox.textContent = '\uD83D\uDDBC\uFE0F';   // ikon cadangan jika gambar hilang
        };
        imgBox.appendChild(img);

        const label = document.createElement('span');
        label.className = w.text.length > 6 ? 'word-text long' : 'word-text';
        label.textContent = w.text;

        card.appendChild(imgBox);
        card.appendChild(label);
        grid.appendChild(card);
    });

    // Back: halaman pertama kembali ke index.html
    backBtn.href = (page === 1) ? '../index.html' : '#';

    // Next: halaman terakhir lanjut ke kuis kata
    if (page === TOTAL_PAGES) {
        nextBtn.href = '../Pelatihan2/Pelatihan2.html';
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