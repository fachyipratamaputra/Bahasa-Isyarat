// ============================================
// DASHBOARD SIGNBRIDGE
// Ubah isi DATA di bawah ini (atau isi dari backend/Ionic kamu nanti).
// ============================================
const DATA = {
    nama: 'David',
    persen: 75,          // progres belajar (0-100)
    totalModul: 10,
    babBerikutnya: 3,    // "Mulai Bab 3"
    streak: 3,           // jumlah hari berturut-turut
    achievement: 'Menyelesaikan 3 Modul tanpa kesalahan.'
};

const CIRCUMFERENCE = 2 * Math.PI * 48; // keliling lingkaran r=48

const $ = id => document.getElementById(id);

function render() {
    $('userName').textContent = DATA.nama.toUpperCase();
    $('totalModul').textContent = DATA.totalModul;
    $('babNo').textContent = DATA.babBerikutnya;
    $('streak').textContent = DATA.streak;
    $('achievementText').textContent = DATA.achievement;

    animateProgress(DATA.persen);
}

// Animasi cincin progres + angka naik dari 0
function animateProgress(target) {
    const ring = $('ring');
    const text = $('percent');
    const value = Math.min(Math.max(target, 0), 100);

    ring.style.strokeDasharray = CIRCUMFERENCE;
    ring.style.strokeDashoffset = CIRCUMFERENCE;

    // Jalankan di frame berikutnya supaya transisi CSS terpicu
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - value / 100);
        });
    });

    const duration = 1400;
    const startTime = performance.now();
    function tick(now) {
        const t = Math.min((now - startTime) / duration, 1);
        text.textContent = Math.round(value * t);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

render();