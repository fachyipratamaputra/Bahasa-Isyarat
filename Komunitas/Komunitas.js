// ============================================
// SIGNFRIENDS
// Data di bawah bisa diganti dengan data dari backend/Ionic kamu nanti.
// Foto profil: ../assets/friends/<nama>.png (kalau belum ada, tampil huruf awal)
// ============================================
const CURRENT_USER = 'David';

const USERS = {
    Ade:    { color: '#D6D6D6', avatar: '../assets/friends/ade.png' },
    Jasmin: { color: '#6B2A2A', avatar: '../assets/friends/jasmin.png' },
    Nada:   { color: '#2A8FD6', avatar: '../assets/friends/nada.png' },
    Widya:  { color: '#1E6B5C', avatar: '../assets/friends/widya.png' },
    David:  { color: '#8A4FD0', avatar: '../assets/avatar.png' }
};

const TOPICS = [
    { tag: 'AbjadDasar',   emoji: '\uD83E\uDD1F' },
    { tag: 'Bahasasehari', emoji: '\uD83D\uDC6A' }
];

let posts = [
    {
        id: 1,
        user: 'Ade',
        image: '../dokumentasi/foto/Dasbor SignFriends dengan Komentar.png',
        caption: 'Ini pengalaman saya belajar bahasa isyarat',
        tag: 'Bahasasehari',
        likes: 0,
        liked: false,
        comments: [
            { user: 'Nada',   text: 'itu apakah bahasa isyarat sehari-hari??' },
            { user: 'Jasmin', text: 'belajar bahasa isyarat itu menyenangkan' }
        ]
    }
];

const filter = { topic: null, user: null, q: '' };

const $ = id => document.getElementById(id);
const feedEl = $('feed');

// ---------- Helper elemen ----------
function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}

// Avatar bulat: huruf awal di bawah, gambar menutupi kalau berhasil dimuat
function avatar(name, large) {
    const u = USERS[name] || { color: '#999', avatar: '' };
    const wrap = el('span', 'av' + (large ? ' lg' : ''), name.charAt(0).toUpperCase());
    wrap.style.background = u.color;
    if (u.avatar) {
        const img = document.createElement('img');
        img.src = u.avatar;
        img.alt = name;
        img.onerror = () => img.remove();
        wrap.appendChild(img);
    }
    return wrap;
}

const SVG = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>',
    chat:  '<svg viewBox="0 0 24 24"><path d="M4 4h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M20 9v8a2 2 0 0 1-2 2h-1v3l-3-3"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>'
};

// ---------- Sidebar ----------
function renderTopics() {
    const box = $('topics');
    box.innerHTML = '';
    const q = filter.q.toLowerCase();
    TOPICS.filter(t => t.tag.toLowerCase().includes(q)).forEach(t => {
        const b = el('button', 'pill' + (filter.topic === t.tag ? ' active' : ''));
        b.type = 'button';
        b.appendChild(el('span', 'emoji', t.emoji));
        b.appendChild(el('span', '', '#' + t.tag));
        b.addEventListener('click', () => {
            filter.topic = (filter.topic === t.tag) ? null : t.tag;
            renderAll();
        });
        box.appendChild(b);
    });
}

function renderStories() {
    const box = $('stories');
    box.innerHTML = '';
    ['Jasmin', 'Nada', 'Ade', 'Widya'].forEach(name => {
        const b = el('button', 'pill' + (filter.user === name ? ' active' : ''));
        b.type = 'button';
        b.appendChild(avatar(name));
        b.appendChild(el('span', 'name', name));
        b.addEventListener('click', () => {
            filter.user = (filter.user === name) ? null : name;
            renderAll();
        });
        box.appendChild(b);
    });
}

// ---------- Feed ----------
function visiblePosts() {
    const q = filter.q.toLowerCase();
    return posts.filter(p =>
        (!filter.topic || p.tag === filter.topic) &&
        (!filter.user || p.user === filter.user) &&
        (!q || p.caption.toLowerCase().includes(q) || p.user.toLowerCase().includes(q))
    );
}

function renderPost(p) {
    const post = el('article', 'post');

    // Kepala: avatar + nama
    const head = el('div', 'post-head');
    head.appendChild(avatar(p.user, true));
    head.appendChild(el('span', '', p.user));
    post.appendChild(head);

    const body = el('div', 'post-body');
    const main = el('div', 'post-main');

    // Gambar
    if (p.image) {
        const img = el('img', 'post-img');
        img.src = p.image;
        img.alt = 'Postingan ' + p.user;
        main.appendChild(img);
    } else {
        main.appendChild(el('div', 'post-img empty', 'Tanpa gambar'));
    }

    // Aksi: suka, komentar, bagikan
    const actions = el('div', 'actions');
    const like = el('button', 'like' + (p.liked ? ' on' : ''));
    like.type = 'button';
    like.setAttribute('aria-label', 'Suka');
    like.innerHTML = SVG.heart;
    if (p.likes > 0) like.appendChild(el('span', '', String(p.likes)));
    like.addEventListener('click', () => {
        p.liked = !p.liked;
        p.likes += p.liked ? 1 : -1;
        renderFeed();
    });

    const chat = el('button', 'chat');
    chat.type = 'button';
    chat.setAttribute('aria-label', 'Komentar');
    chat.innerHTML = SVG.chat;
    if (p.comments.length) chat.appendChild(el('span', '', String(p.comments.length)));

    const share = el('button', 'share');
    share.type = 'button';
    share.setAttribute('aria-label', 'Bagikan');
    share.innerHTML = SVG.share;
    share.addEventListener('click', () => sharePost(p));

    actions.append(like, chat, share);
    main.appendChild(actions);

    // Keterangan
    const cap = el('div', 'caption');
    cap.appendChild(el('strong', '', p.user));
    cap.appendChild(el('span', '', p.caption));
    main.appendChild(cap);

    body.appendChild(main);

    // Panel komentar
    const panel = el('aside', 'comments');
    panel.appendChild(el('h3', '', 'Komentar'));
    const list = el('ul', 'comment-list');
    p.comments.forEach(c => {
        const li = el('li', 'comment');
        li.appendChild(avatar(c.user));
        const txt = el('div');
        txt.appendChild(el('b', '', c.user));
        txt.appendChild(el('p', '', c.text));
        li.appendChild(txt);
        list.appendChild(li);
    });
    panel.appendChild(list);

    const form = el('form', 'comment-form');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Tambahkan Komentar...';
    input.maxLength = 200;
    const send = el('button', '', 'Kirim');
    send.type = 'submit';
    form.append(input, send);
    form.addEventListener('submit', e => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        p.comments.push({ user: CURRENT_USER, text });
        renderFeed();
    });
    panel.appendChild(form);

    body.appendChild(panel);
    post.appendChild(body);
    return post;
}

function renderFeed() {
    feedEl.innerHTML = '';
    const list = visiblePosts();
    if (!list.length) {
        feedEl.appendChild(el('p', 'no-result', 'Tidak ada postingan yang cocok.'));
    } else {
        list.forEach(p => feedEl.appendChild(renderPost(p)));
    }
}

function renderAll() {
    renderTopics();
    renderStories();
    renderFeed();
}

// ---------- Bagikan ----------
function sharePost(p) {
    const text = p.user + ': ' + p.caption;
    if (navigator.share) {
        navigator.share({ title: 'SignFriends', text, url: location.href }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text + ' ' + location.href).then(() => alert('Tautan disalin!'));
    }
}

// ---------- Cari ----------
$('searchInput').addEventListener('input', e => {
    filter.q = e.target.value.trim();
    renderAll();
});

// ---------- Postingan baru (tombol +) ----------
const modal = $('modal');
const form = $('postForm');

$('addBtn').addEventListener('click', () => {
    modal.hidden = false;
    $('caption').focus();
});
$('cancelBtn').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
    modal.hidden = true;
    form.reset();
}

form.addEventListener('submit', e => {
    e.preventDefault();
    const caption = $('caption').value.trim();
    if (!caption) return;

    const file = $('photo').files[0];
    const addPost = image => {
        posts.unshift({
            id: Date.now(),
            user: CURRENT_USER,
            image: image || '',
            caption,
            tag: $('tagSelect').value,
            likes: 0,
            liked: false,
            comments: []
        });
        closeModal();
        renderAll();
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = () => addPost(reader.result);
        reader.readAsDataURL(file);
    } else {
        addPost('');
    }
});

renderAll();