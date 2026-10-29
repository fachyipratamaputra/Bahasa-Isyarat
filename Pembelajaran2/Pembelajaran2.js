// ============================================
// BAHASA SEHARI-HARI BISINDO - 6 kata per halaman
// Gambar: ../assets/kata/rumah.png, kerja.png, dst.
// Mau tambah kata? Cukup tambah baris di WORDS, halaman otomatis bertambah.
// ============================================
const WORDS = [
    { text: 'Rumah',     img: '../assets/kata/rumah.png' },
    { text: 'Kerja',     img: '../assets/kata/kerja.png' },
    { text: 'Pulang',    img: '../assets/kata/pulang.png' },
    { text: 'Sekolah',   img: '../assets/kata/sekolah.png' },
    { text: 'Hati-hati', img: '../assets/kata/hati-hati.png' },
    { text: 'Umur',      img: '../assets/kata/umur.png' }
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
        img.src = w.img;
        img.alt = 'Isyarat ' + w.text;
        imgBox.appendChild(img);

        const label = document.createElement('span');
        label.className = w.text.length > 6 ? 'word-text long' : 'word-text';
        label.textContent = w.text;

        card.appendChild(imgBox);
        card.appendChild(label);
        grid.appendChild(card);
    });

    // Back: halaman pertama kembali ke halaman Alfabet (halaman terakhir)
    backBtn.href = (page === 1) ? '../Pembelajaran/Pembelajaran.html?page=3' : '#';

    // Next: halaman terakhir lanjut ke kuis kata
    if (page === TOTAL_PAGES) {
        nextBtn.href = '../Pelatihan2/Pelatihan2.html';
    } else {
        nextBtn.href = '#';
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