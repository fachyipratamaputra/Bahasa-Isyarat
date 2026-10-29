// ============================================
// PILIHAN MODUL PELATIHAN
// Ubah isi MODULES di bawah. Persen bisa diisi dari backend/Ionic nanti.
// locked: true  -> tampil sebagai "Segera Hadir" (tidak bisa diklik)
// ============================================
const MODULES = [
    { title: 'Pengantar Bahasa Isyarat', percent: 50,  icon: '../assets/modul/pengantar.png', href: '#' },
    { title: 'Alphabet',                 percent: 100, icon: '../assets/modul/alphabet.png',  href: '../Pembelajaran/Pembelajaran.html' },
    { title: 'Angka',                    percent: 0,   icon: '../assets/modul/angka.png',     href: '#' },
    { title: 'Bahasa Sehari-hari',       percent: 30,  icon: '../assets/modul/sehari.png',    href: '../Pembelajaran2/Pembelajaran2.html' },
    { title: 'Segera Hadir', locked: true },
    { title: 'Segera Hadir', locked: true }
];

const LOCK_ICON = '../assets/modul/lock.png';
const grid = document.getElementById('grid');

function createCard(m) {
    // ----- Kartu terkunci -----
    if (m.locked) {
        const card = document.createElement('div');
        card.className = 'modul-card locked';
        card.innerHTML =
            '<img class="modul-icon" src="' + LOCK_ICON + '" alt="Terkunci" />' +
            '<h2 class="modul-title">' + m.title + '</h2>' +
            '<div class="bar"><div class="bar-fill" style="display:none"></div></div>';
        return card;
    }

    // ----- Kartu modul biasa -----
    const percent = Math.min(Math.max(m.percent, 0), 100);
    const card = document.createElement('a');
    card.className = 'modul-card';
    card.href = m.href;
    card.innerHTML =
        '<div>' +
            '<div class="modul-head">' +
                '<h2 class="modul-title">' + m.title + '</h2>' +
                '<img class="modul-icon" src="' + m.icon + '" alt="" />' +
            '</div>' +
            '<p class="modul-percent">' + percent + '%</p>' +
        '</div>' +
        '<div class="bar"><div class="bar-fill" data-percent="' + percent + '"></div></div>';
    return card;
}

function render() {
    grid.innerHTML = '';
    MODULES.forEach(m => grid.appendChild(createCard(m)));

    // Animasi bar terisi dari 0 ke persen masing-masing
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll('.bar-fill[data-percent]').forEach(el => {
                el.style.width = el.dataset.percent + '%';
            });
        });
    });
}

render();