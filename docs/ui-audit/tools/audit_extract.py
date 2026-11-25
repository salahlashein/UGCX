"""Compact per-screen digest of uicheck results: the items worth citing."""
import json, os, sys

KEYS = ['overflow', 'contrast', 'names', 'focus_invisible', 'media', 'headings', 'targets',
        'card_rows', 'baselines', 'control_heights', 'grid_orphans', 'widows', 'table_sticky']

def short(x, n=150):
    s = json.dumps(x, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + '...'

def digest(path):
    d = json.load(open(path, encoding='utf-8'))
    out = []
    for w, vp in d['viewports'].items():
        parts = []
        for k in KEYS:
            v = vp.get(k)
            if not v:
                continue
            if isinstance(v, list):
                items = v[:4] if k in ('contrast', 'names', 'focus_invisible', 'media', 'headings') else v[:2]
                parts.append(f'  {k} ({len(v)}): ' + ' | '.join(short(i) for i in items))
            else:
                parts.append(f'  {k}: {short(v)}')
        out.append(f'@{w}\n' + '\n'.join(parts))
    return '\n'.join(out)

if __name__ == '__main__':
    base = sys.argv[1]
    for name in sys.argv[2:]:
        p = os.path.join(base, name, 'checks.json')
        if os.path.exists(p):
            sys.stdout.buffer.write((f'=== {name}\n' + digest(p) + '\n').encode('utf-8'))
