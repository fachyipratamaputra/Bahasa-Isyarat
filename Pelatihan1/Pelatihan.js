// Ganti 'img' sesuai nama file gambar isyarat kamu di folder assets/
const questions = [
    { img: 'assets/quiz-t.png', options: ['A', 'F', 'C'], answer: 'F' },
    { img: 'assets/quiz-a.png', options: ['A', 'B', 'D'], answer: 'A' },
    { img: 'assets/quiz-c.png', options: ['C', 'E', 'G'], answer: 'C' },
    { img: 'assets/quiz-l.png', options: ['L', 'M', 'N'], answer: 'L' },
    { img: 'assets/quiz-o.png', options: ['O', 'P', 'Q'], answer: 'O' }
];

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
    nextBtn.textContent = index === questions.length - 1 ? 'Selesai' : 'Selanjutnya';
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

    // Klik pertama: tampilkan benar/salah. Klik kedua: lanjut.
    if (!answered) {
        answered = true;
        if (selected === q.answer) score++;
        document.querySelectorAll('.option').forEach(o => {
            o.disabled = true;
            if (o.textContent === q.answer) o.classList.add('correct');
            else if (o.textContent === selected) o.classList.add('wrong');
        });
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
    index = 0;
    score = 0;
    quizBody.hidden = false;
    questionEl.hidden = false;
    resultEl.hidden = true;
    render();
});

render();