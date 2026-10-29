// ============================================
// SIGNBRIDGE - LOGIKA KUIS
// Soal bisa diganti lewat file data (window.QUIZ_QUESTIONS),
// contoh: quiz-kata-data.js. Kalau tidak ada, pakai soal huruf di bawah.
// ============================================
// Soal kuis kata. Ganti 'img' sesuai nama file gambar di folder assets/
window.QUIZ_QUESTIONS = [
    { img: 'assets/kata-kerja.png',  options: ['Kerja', 'Umur', 'Pulang'],   answer: 'Kerja' },
    { img: 'assets/kata-umur.png',   options: ['Makan', 'Umur', 'Tidur'],    answer: 'Umur' },
    { img: 'assets/kata-pulang.png', options: ['Pulang', 'Pergi', 'Datang'], answer: 'Pulang' },
    { img: 'assets/kata-makan.png',  options: ['Minum', 'Mandi', 'Makan'],   answer: 'Makan' },
    { img: 'assets/kata-tidur.png',  options: ['Tidur', 'Bangun', 'Duduk'],  answer: 'Tidur' }
];

const questions = (Array.isArray(window.QUIZ_QUESTIONS) && window.QUIZ_QUESTIONS.length)
    ? window.QUIZ_QUESTIONS
    : DEFAULT_QUESTIONS;

// ---------- State ----------
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

// ---------- Ulangi ----------
retryBtn.addEventListener('click', () => {
    index = 0;
    score = 0;
    quizBody.hidden = false;
    questionEl.hidden = false;
    resultEl.hidden = true;
    render();
});

// ---------- Mulai ----------
render();