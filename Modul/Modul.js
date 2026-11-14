// ============================================
// PILIHAN MODUL PELATIHAN
// Ubah isi MODULES di bawah. Persen bisa diisi dari backend/Ionic nanti.
// locked: true  -> tampil sebagai "Segera Hadir" (tidak bisa diklik)
//
// Ikon dicari otomatis berdasarkan NAMA FILE (tanpa .png) di folder-folder
// pada ICON_FOLDERS. Contoh: 'Angka' -> ../dokumentasi/foto/Angka.png
// Kalau ikon pertama tidak ketemu, dicoba nama berikutnya di daftar.
// ============================================
const ICON_FOLDERS = [
    '../dokumentasi/foto/',   // Alfabet.png, Angka.png, dst.
    '../dokumentasi/'         // Pengantar Bahasa Isyarat.png (kalau ada di sini)
];

const MODULES = [
    { title: 'Pengantar Bahasa Isyarat', percent: 50,  icon: ['Pengantar Bahasa Isyarat'],                href: '#' },
    { title: 'Alphabet',                 percent: 100, icon: ['Alfabet'],                                 href: '../Pembelajaran/Pembelajaran.html' },
    { title: 'Angka',                    percent: 0,   icon: ['Angka'],                                   href: '#' },
    // Belum ada ikon khusus "Bahasa Sehari-hari": kalau nanti dibuat dengan nama "Sehari hari.png",
    // otomatis terpakai. Sementara memakai ikon Pengantar.
    { title: 'Bahasa Sehari-hari',       percent: 30,  icon: ['Sehari hari', 'Pengantar Bahasa Isyarat'], href: '../Pembelajaran2/Pembelajaran2.html' },
    { title: 'Segera Hadir', locked: true },
    { title: 'Segera Hadir', locked: true }
];

// Ikon gembok untuk kartu "Segera Hadir" (file: "Segera hadir.png")
const LOCK_ICON = ['Segera hadir', 'Segera Hadir'];

const grid = document.getElementById('grid');

// Pasang gambar dengan beberapa kemungkinan lokasi; berhenti di yang pertama berhasil dimuat
function setIcon(img, names) {
    const list = [];
    names.forEach(name => {
        ICON_FOLDERS.forEach(folder => list.push(encodeURI(folder + name + '.png')));
    });

    let i = 0;
    img.onerror = () => {
        i++;
        if (i < list.length) {
            img.src = list[i];
        } else {
            console.warn('Ikon tidak ditemukan untuk:', names.join(' / '));
            img.style.visibility = 'hidden';
        }
    };
    img.src = list[0];
}

function createCard(m) {
    // ----- Kartu terkunci -----
    if (m.locked) {
        const card = document.createElement('div');
        card.className = 'modul-card locked';

        const icon = document.createElement('img');
        icon.className = 'modul-icon';
        icon.alt = 'Terkunci';
        setIcon(icon, LOCK_ICON);

        const title = document.createElement('h2');
        title.className = 'modul-title';
        title.textContent = m.title;

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.innerHTML = '<div class="bar-fill" style="display:none"></div>';

        card.append(icon, title, bar);
        return card;
    }

    // ----- Kartu modul biasa -----
    const percent = Math.min(Math.max(m.percent, 0), 100);
    const card = document.createElement('a');
    card.className = 'modul-card';
    card.href = m.href;

    const top = document.createElement('div');

    const head = document.createElement('div');
    head.className = 'modul-head';

    const title = document.createElement('h2');
    title.className = 'modul-title';
    title.textContent = m.title;

    const icon = document.createElement('img');
    icon.className = 'modul-icon';
    icon.alt = '';
    setIcon(icon, m.icon);

    head.append(title, icon);

    const pct = document.createElement('p');
    pct.className = 'modul-percent';
    pct.textContent = percent + '%';

    top.append(head, pct);

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.innerHTML = '<div class="bar-fill" data-percent="' + percent + '"></div>';

    card.append(top, bar);
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