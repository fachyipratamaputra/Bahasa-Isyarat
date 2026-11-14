// =====================================================
// SIGNBRIDGE - KUIS ALFABET BISINDO (Pelatihan 1)
// Setiap kuis dimulai atau diulang, soal DIACAK ulang dari 26 huruf,
// jadi isi kuis tidak selalu sama. Gambar diambil dari
// ../dokumentasi/foto/Alfabet/ (A.png, B.png, ... Z.png).
// =====================================================
const IMG_FOLDER = '../dokumentasi/foto/Alfabet/';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const QUESTION_COUNT = 5;   // jumlah soal tiap kuis
const OPTION_COUNT = 3;     // jumlah pilihan jawaban
const STORE_KEY = 'signbridge_alfabet_terakhir';

// Hosting online membedakan huruf besar/kecil, jadi nama file harus sama persis.
function imageOf(letter) {
    return IMG_FOLDER + letter + '.png';
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Ingat huruf kuis sebelumnya supaya kuis berikutnya memakai huruf yang berbeda
function loadLast() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
}
function saveLast(list) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(list)); }
    catch (e) { /* penyimpanan tidak tersedia, abaikan */ }
}

function buildQuestions() {
    const last = loadLast();
    const fresh = shuffle(LETTERS.filter(l => !last.includes(l)));
    const used  = shuffle(LETTERS.filter(l => last.includes(l)));
    const chosen = fresh.concat(used).slice(0, QUESTION_COUNT);
    saveLast(chosen);

    return chosen.map(letter => {
        const wrong = shuffle(LETTERS.filter(l => l !== letter)).slice(0, OPTION_COUNT - 1);
        return {
            img: imageOf(letter),
            options: shuffle([letter].concat(wrong)),
            answer: letter
        };
    });
}

let questions = buildQuestions();
let index = 0;
let score = 0;
let selected = null;
let answered = false;

const bar = document.getElementById('bar');
const signImg = document.getElementById('signImg');
const optionsEl = document.getElementById('options');
const nextBtn = document.getElementById('nextBtn');
const quizBody = document.getElementById('quizBody');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score');
const questionEl = document.querySelector('.question');

function render() {
    const q = questions[index];
    selected = null;
    answered = false;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Periksa';
    signImg.alt = 'Gerakan isyarat';
    signImg.src = q.img;
    optionsEl.innerHTML = '';
    q.options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'option';
        b.textContent = opt;
        b.addEventListener('click', () => choose(b, opt));
        optionsEl.appendChild(b);
    });
    bar.style.width = Math.max(6, (index / questions.length) * 100) + '%';
}

signImg.addEventListener('error', () => {
    signImg.alt = 'Gambar tidak ditemukan';
});

function choose(btn, opt) {
    if (answered) return;
    selected = opt;
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
    nextBtn.disabled = false;
}

nextBtn.addEventListener('click', () => {
    if (selected === null) return;
    const q = questions[index];

    // Klik pertama ("Periksa"): tampilkan benar/salah. Klik kedua: lanjut.
    if (!answered) {
        answered = true;
        if (selected === q.answer) score++;
        document.querySelectorAll('.option').forEach(o => {
            o.disabled = true;
            if (o.textContent === q.answer) o.classList.add('correct');
            else if (o.textContent === selected) o.classList.add('wrong');
        });
        nextBtn.textContent = index === questions.length - 1 ? 'Selesai' : 'Selanjutnya';
        return;
    }

    index++;
    if (index < questions.length) {
        render();
    } else {
        finish();
    }
});

function finish() {
    bar.style.width = '100%';
    quizBody.hidden = true;
    questionEl.hidden = true;
    resultEl.hidden = false;
    scoreEl.textContent = score + ' / ' + questions.length;
}

document.getElementById('retryBtn').addEventListener('click', () => {
    questions = buildQuestions();   // soal baru, berbeda dari kuis sebelumnya
    index = 0;
    score = 0;
    quizBody.hidden = false;
    questionEl.hidden = false;
    resultEl.hidden = true;
    render();
});

render();