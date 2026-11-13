// ============================================
// ROBOT "AI PENERJEMAH"
// 1) selalu menempel di kanan layar (CSS position: fixed)
// 2) saat di-scroll, robot sedikit "tertinggal" lalu menyusul (terasa mengikuti)
// 3) bubble mengetik pesan bergantian
// 4) bola mata robot melirik ke arah kursor
// ============================================
(function () {
    const widget = document.getElementById('ai');
    if (!widget) return;
    const follow = widget.querySelector('.ai-follow');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Tombol tutup ---------- */
    const closeBtn = widget.querySelector('.ai-close');
    if (closeBtn) closeBtn.addEventListener('click', () => widget.classList.add('hidden'));

    /* ---------- 2. Efek mengikuti scroll ---------- */
    if (!reduce) {
        let lastY = window.scrollY, target = 0, offset = 0, running = false;

        function loop() {
            offset += (target - offset) * 0.14;   // menyusul pelan
            target *= 0.88;                       // dorongan memudar
            follow.style.transform =
                'translateY(' + offset.toFixed(1) + 'px) rotate(' + (offset * 0.15).toFixed(2) + 'deg)';
            if (Math.abs(offset) > 0.1 || Math.abs(target) > 0.1) {
                requestAnimationFrame(loop);
            } else {
                follow.style.transform = '';
                running = false;
            }
        }

        window.addEventListener('scroll', () => {
            const dy = window.scrollY - lastY;
            lastY = window.scrollY;
            // scroll ke bawah -> robot tertinggal ke atas, scroll ke atas -> tertinggal ke bawah
            target = Math.max(-45, Math.min(45, target - dy * 0.9));
            if (!running) { running = true; requestAnimationFrame(loop); }
        }, { passive: true });
    }

    /* ---------- 4. Mata melirik ke kursor ---------- */
    const pupils = widget.querySelector('.pupils');
    if (pupils && !reduce) {
        window.addEventListener('mousemove', (e) => {
            const r = widget.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.bottom - 60;
            const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 400));
            const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 400));
            pupils.style.transform = 'translate(' + (dx * 4).toFixed(1) + 'px,' + (dy * 3).toFixed(1) + 'px)';
        }, { passive: true });
    }

    /* ---------- 3. Bubble mengetik ---------- */
    const bubbleText = document.getElementById('aiTyped');
    const MESSAGES = [
        'Halo! Aku Bridge \uD83D\uDC4B',
        'Aku AI Penerjemah isyarat BISINDO.',
        'Arahkan tanganmu ke kamera, aku terjemahkan!'
    ];

    if (bubbleText) {
        if (reduce) {
            bubbleText.textContent = MESSAGES[0];
        } else {
            let m = 0, c = 0, deleting = false;
            (function tick() {
                const msg = MESSAGES[m];
                if (!deleting) {
                    c++;
                    bubbleText.textContent = msg.slice(0, c);
                    if (c === msg.length) { deleting = true; return setTimeout(tick, 2200); }
                    setTimeout(tick, 55);
                } else {
                    c -= 2;
                    if (c <= 0) { c = 0; deleting = false; m = (m + 1) % MESSAGES.length; bubbleText.textContent = ''; return setTimeout(tick, 350); }
                    bubbleText.textContent = msg.slice(0, c);
                    setTimeout(tick, 25);
                }
            })();
        }
    }
})();