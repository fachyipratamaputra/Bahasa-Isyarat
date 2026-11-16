"""
Cek (dan perbaiki) tautan yang salah huruf besar/kecil.

Windows tidak membedakan huruf besar/kecil pada nama folder/file, tapi server
online (Vercel, Netlify, GitHub Pages) membedakannya. Akibatnya link seperti
"login/Login.html" jalan di laptop tapi 404 di internet kalau foldernya "Login".

Cara pakai (letakkan file ini di folder utama proyek, sejajar index.html):
    python cek_link.py              -> hanya laporan
    python cek_link.py --perbaiki   -> laporan + perbaiki otomatis yang beda huruf
"""
import os, re, sys
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP_DIRS = {'venv', 'venv-ai', '.git', 'node_modules', '__pycache__', 'backend-python', '.vercel'}
EXTS = ('.html', '.htm', '.js', '.css')

PATTERNS = [
    re.compile(r'''\b(?:href|src|action|poster)\s*=\s*(["'])([^"']+?)\1''', re.I),   # atribut HTML & JS (el.href = '...')
    re.compile(r'''\bREDIRECT_TO\s*=\s*(["'])([^"']+?)\1'''),
    re.compile(r'''\blocation(?:\.href)?\s*=\s*(["'])([^"']+?)\1'''),
    re.compile(r'''url\(\s*(["']?)([^"')]+?)\1\s*\)''', re.I),                         # CSS url(...)
]
SKIP_PREFIX = ('http://', 'https://', '//', 'data:', 'mailto:', 'tel:', '#', 'javascript:', 'blob:')


def resolve(base_dir, ref):
    """Cari ref di disk dengan huruf PERSIS. Kembalikan (status, ref_benar)."""
    clean = re.split(r'[?#]', ref)[0]
    if not clean or clean.startswith(SKIP_PREFIX) or '${' in clean or '{{' in clean:
        return 'lewati', ref
    if clean.startswith('/'):
        cur, parts, lead = ROOT, clean.lstrip('/').split('/'), '/'
    else:
        cur, parts, lead = base_dir, clean.split('/'), ''
    fixed, changed = [], False
    for p in parts:
        if p in ('', '.'):
            fixed.append(p); continue
        if p == '..':
            cur = os.path.dirname(cur); fixed.append(p); continue
        name = unquote(p)
        try:
            entries = os.listdir(cur)
        except OSError:
            return 'hilang', ref
        if name in entries:
            cur = os.path.join(cur, name); fixed.append(p); continue
        match = [e for e in entries if e.lower() == name.lower()]
        if match:
            if '%' in p:
                return 'hilang', ref          # nama ber-encode: laporkan saja
            cur = os.path.join(cur, match[0]); fixed.append(match[0]); changed = True
        else:
            return 'hilang', ref
    result = lead + '/'.join(fixed) + ref[len(clean):]
    return ('huruf' if changed else 'ok'), result


def main():
    perbaiki = '--perbaiki' in sys.argv
    huruf, hilang, total = [], [], 0
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            if not fn.lower().endswith(EXTS):
                continue
            path = os.path.join(dp, fn)
            with open(path, encoding='utf-8', errors='replace', newline='') as f:
                text = f.read()
            new_text, seen = text, []
            for pat in PATTERNS:
                for m in pat.finditer(text):
                    ref = m.group(2)
                    status, fixed = resolve(dp, ref)
                    if status == 'lewati':
                        continue
                    total += 1
                    line = text.count('\n', 0, m.start()) + 1
                    rel = os.path.relpath(path, ROOT)
                    if status == 'huruf':
                        huruf.append((rel, line, ref, fixed))
                        if perbaiki:
                            seen.append((ref, fixed))
                    elif status == 'hilang':
                        hilang.append((rel, line, ref))
            if perbaiki and seen:
                for old, new in set(seen):
                    new_text = new_text.replace(old, new)
                with open(path, 'w', encoding='utf-8', newline='') as f:
                    f.write(new_text)

    print(f'Dicek {total} tautan.\n')
    if huruf:
        print('== HURUF BESAR/KECIL BEDA (jalan di Windows, 404 di server online) ==')
        for rel, line, old, new in huruf:
            print(f'  {rel}:{line}   {old}   ->   {new}')
        print('  ' + ('Sudah diperbaiki otomatis.' if perbaiki else 'Jalankan: python cek_link.py --perbaiki'))
    else:
        print('Tidak ada tautan yang salah huruf. Bagus!')
    if hilang:
        print('\n== FILE TIDAK DITEMUKAN (bukan soal huruf, perlu dicek manual) ==')
        for rel, line, ref in hilang:
            print(f'  {rel}:{line}   {ref}')


if __name__ == '__main__':
    main()