// ============================================
// AI PENERJEMAH - kamera + deteksi tangan (MediaPipe Hands)
// File: Penerjemah/Penerjemah.js
//
// Catatan: kamera hanya bisa jalan di HTTPS atau http://localhost
// ============================================
(function () {
    const screen    = document.getElementById('screen');
    const video     = document.getElementById('cam');
    const canvas    = document.getElementById('overlay');
    const ctx       = canvas.getContext('2d');
    const msgTitle  = document.getElementById('msgTitle');
    const msgText   = document.getElementById('msgText');
    const liveTag   = document.getElementById('liveTag');
    const btnStart  = document.getElementById('btnStart');
    const btnStop   = document.getElementById('btnStop');
    const btnClear  = document.getElementById('btnClear');
    const resultEl  = document.getElementById('resultText');
    const metaEl    = document.getElementById('resultMeta');
    const meterBar  = document.getElementById('meterBar');
    const historyEl = document.getElementById('historyList');

    let hands = null, camera = null, running = false;

    /* ------------------------------------------------------------
       PENGENALAN GERAKAN
       Fungsi ini menerima 21 titik (landmark) satu tangan dan
       mengembalikan { label, confidence }.
       Versi demo: berdasarkan jumlah jari yang terbuka.
       Untuk model BISINDO sungguhan, timpa dengan:
           window.SignBridgeClassify = function (landmarks) {
               return { label: 'A', confidence: 0.93 };
           };
       ------------------------------------------------------------ */
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    function countFingers(lm) {
        // Jempar: terbuka jika ujungnya lebih jauh dari pangkal kelingking daripada ruas di bawahnya
        let n = dist(lm[4], lm[17]) > dist(lm[3], lm[17]) * 1.05 ? 1 : 0;
        // 4 jari lain: ujung (tip) lebih jauh dari pergelangan daripada sendi tengah (pip)
        [[8, 6], [12, 10], [16, 14], [20, 18]].forEach(([tip, pip]) => {
            if (dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]) * 1.08) n++;
        });
        return n;
    }

    const DEMO_LABELS = {
        0: 'Kepalan',
        1: 'Satu',
        2: 'Dua',
        3: 'Tiga',
        4: 'Empat',
        5: 'Halo \uD83D\uDC4B'
    };

    function demoClassify(lm) {
        const n = countFingers(lm);
        return { label: DEMO_LABELS[n], confidence: 0.7 };
    }

    function classify(lm) {
        return (window.SignBridgeClassify || demoClassify)(lm);
    }

    /* ------------------------------------------------------------
       Tampilan hasil + riwayat (label harus stabil beberapa frame)
       ------------------------------------------------------------ */
    let candidate = null, streak = 0, shown = null;
    const STABLE_FRAMES = 8;

    function setResult(label, conf, count) {
        resultEl.textContent = label;
        resultEl.classList.remove('muted');
        meterBar.style.width = Math.round(conf * 100) + '%';
        metaEl.textContent = 'Tangan terdeteksi: ' + count + ' \u2022 Keyakinan ' + Math.round(conf * 100) + '%';
    }
    function setIdle() {
        resultEl.textContent = 'Menunggu gerakan tangan...';
        resultEl.classList.add('muted');
        meterBar.style.width = '0';
        metaEl.textContent = 'Tangan terdeteksi: -';
        candidate = null; streak = 0; shown = null;
    }
    function addHistory(label) {
        const empty = historyEl.querySelector('.empty');
        if (empty) empty.remove();
        const li = document.createElement('li');
        const t = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        li.innerHTML = '<span></span><time>' + t + '</time>';
        li.firstChild.textContent = label;
        historyEl.prepend(li);
        while (historyEl.children.length > 30) historyEl.lastChild.remove();
    }
    function commit(label) {
        if (label === shown) return;
        shown = label;
        addHistory(label);
    }

    /* ------------------------------------------------------------
       Hasil deteksi tiap frame
       ------------------------------------------------------------ */
    function onResults(res) {
        if (canvas.width !== video.videoWidth && video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

        const list = res.multiHandLandmarks || [];
        list.forEach((lm) => {
            drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#CDE53D', lineWidth: 4 });
            drawLandmarks(ctx, lm, { color: '#7B52C8', fillColor: '#fff', lineWidth: 2, radius: 4 });
        });
        ctx.restore();

        if (!list.length) { setIdle(); return; }

        const out = classify(list[0]);
        setResult(out.label, out.confidence, list.length);

        if (out.label === candidate) streak++;
        else { candidate = out.label; streak = 1; }
        if (streak >= STABLE_FRAMES) commit(out.label);
    }

    /* ------------------------------------------------------------
       Mulai / hentikan kamera
       ------------------------------------------------------------ */
    function showMsg(title, text) {
        screen.classList.remove('active');
        msgTitle.textContent = title;
        msgText.textContent = text;
    }

    async function start() {
        if (running) return;
        if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
            showMsg('Gagal memuat AI', 'Pastikan koneksi internet aktif lalu muat ulang halaman.');
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showMsg('Kamera tidak didukung', 'Buka lewat HTTPS atau http://localhost.');
            return;
        }

        btnStart.disabled = true;
        showMsg('Memuat AI...', 'Mohon tunggu dan izinkan akses kamera.');

        try {
            if (!hands) {
                hands = new Hands({
                    locateFile: (f) => 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + f
                });
                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.7,
                    minTrackingConfidence: 0.6
                });
                hands.onResults(onResults);
            }
            camera = new Camera(video, {
                onFrame: async () => { await hands.send({ image: video }); },
                width: 1280, height: 720
            });
            await camera.start();

            running = true;
            screen.classList.add('active');
            liveTag.hidden = false;
            btnStop.disabled = false;
        } catch (err) {
            running = false;
            btnStart.disabled = false;
            const denied = err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
            showMsg(
                denied ? 'Akses kamera ditolak' : 'Kamera tidak bisa dibuka',
                denied ? 'Izinkan kamera di pengaturan browser, lalu coba lagi.' : 'Pastikan kamera tersedia dan tidak dipakai aplikasi lain.'
            );
        }
    }

    function stop() {
        if (camera) { camera.stop(); camera = null; }
        if (video.srcObject) {
            video.srcObject.getTracks().forEach((t) => t.stop());
            video.srcObject = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        running = false;
        liveTag.hidden = true;
        btnStart.disabled = false;
        btnStop.disabled = true;
        setIdle();
        showMsg('Kamera belum aktif', 'Tekan tombol "Mulai Kamera" untuk memulai.');
    }

    btnStart.addEventListener('click', start);
    btnStop.addEventListener('click', stop);
    btnClear.addEventListener('click', () => {
        historyEl.innerHTML = '<li class="empty">Belum ada terjemahan.</li>';
        shown = null;
    });
    window.addEventListener('pagehide', stop);

    setIdle();
})();