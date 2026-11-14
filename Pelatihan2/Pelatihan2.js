// =====================================================
// SIGNBRIDGE - KUIS KOSAKATA BISINDO (Pelatihan 2)
// Soal dibuat otomatis dari daftar kata di bawah (sama dengan
// halaman Pembelajaran2), dan DIACAK ulang setiap kuis dimulai
// atau diulang. Mau tambah kata? Cukup tambah baris di WORDS
// (dan taruh gambarnya di folder assets/kata/).
// =====================================================
const IMG_FOLDER = '../assets/kata/';
const WORDS = [
    { text: 'Rumah',     file: 'rumah.png' },
    { text: 'Kerja',     file: 'kerja.png' },
    { text: 'Pulang',    file: 'pulang.png' },
    { text: 'Sekolah',   file: 'sekolah.png' },
    { text: 'Hati-hati', file: 'hati-hati.png' },
    { text: 'Umur',      file: 'umur.png' }
];
const QUESTION_COUNT = 5;   // jumlah soal tiap kuis
const OPTION_COUNT = 3;     // jumlah pilihan jawaban

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildQuestions() {
    const total = Math.min(QUESTION_COUNT, WORDS.length);
    return shuffle(WORDS).slice(0, total).map(word => {
        const wrong = shuffle(WORDS.filter(w => w.text !== word.text))
            .slice(0, OPTION_COUNT - 1)
            .map(w => w.text);
        return {
            img: IMG_FOLDER + word.file,
            options: shuffle([word.text].concat(wrong)),
            answer: word.text
        };
    });
}

// ---------- State ----------
let questions = buildQuestions();
let index = 0;        // nomor soal sekarang
let score = 0;        // jumlah jawaban benar
let selected = null;  // jawaban yang dipilih
let checked = false;  // sudah diperiksa atau belum

// ---------- Elemen ----------
const bar        = document.getElementById('bar');
const signImg    = document.getElementById('signImg');
const optionsEl  = document.getElementById('options');
const nextBtn    = document.getElementById('nextBtn');
const quizBody   = document.getElementById('quizBody');
const resultEl   = document.getElementById('result');
const scoreEl    = document.getElementById('score');
const questionEl = document.querySelector('.question');
const retryBtn   = document.getElementById('retryBtn');

// ---------- Progress bar ----------
function updateBar(done) {
    const pct = (done / questions.length) * 100;
    bar.style.width = Math.max(6, pct) + '%';
}

signImg.addEventListener('error', () => {
    signImg.alt = 'Gambar belum tersedia';
});

// ---------- Tampilkan soal ----------
function render() {
    const q = questions[index];
    selected = null;
    checked = false;

    signImg.src = q.img;
    signImg.alt = 'Gerakan isyarat nomor ' + (index + 1);

    optionsEl.innerHTML = '';
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = opt.length > 1 ? 'option word' : 'option';
        btn.textContent = opt;
        btn.addEventListener('click', () => choose(btn, opt));
        optionsEl.appendChild(btn);
    });

    nextBtn.textContent = 'Periksa';
    nextBtn.disabled = true;
    updateBar(index);
}

// ---------- Pilih jawaban ----------
function choose(btn, opt) {
    if (checked) return;
    selected = opt;
    optionsEl.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
    nextBtn.disabled = false;
}

// ---------- Periksa jawaban ----------
function checkAnswer() {
    const q = questions[index];
    checked = true;
    if (selected === q.answer) score++;

    optionsEl.querySelectorAll('.option').forEach(o => {
        o.disabled = true;
        o.classList.remove('selected');
        if (o.textContent === q.answer) o.classList.add('correct');
        else if (o.textContent === selected) o.classList.add('wrong');
    });

    nextBtn.textContent = (index === questions.length - 1) ? 'Selesai' : 'Selanjutnya';
    updateBar(index + 1);
}

// ---------- Tombol utama: Periksa -> Selanjutnya/Selesai ----------
nextBtn.addEventListener('click', () => {
    if (selected === null) return;

    if (!checked) {
        checkAnswer();
        return;
    }

    index++;
    if (index < questions.length) {
        render();
    } else {
        finish();
    }
});

// ---------- Hasil akhir ----------
function finish() {
    updateBar(questions.length);
    quizBody.hidden = true;
    questionEl.hidden = true;
    resultEl.hidden = false;
    scoreEl.textContent = score + ' / ' + questions.length;
}

// ---------- Ulangi (soal baru, diacak lagi) ----------
retryBtn.addEventListener('click', () => {
    questions = buildQuestions();
    index = 0;
    score = 0;
    quizBody.hidden = false;
    questionEl.hidden = false;
    resultEl.hidden = true;
    render();
});

// ---------- Mulai ----------
render();