"""Runs uicheck_auth.py on every brand and creator screen of the LOCAL app."""
import os, subprocess, sys, json

BASE = 'http://localhost:3001'
LIVE = '217c64f3-7022-4f91-be9f-20520dd2b98a'
DRAFT = 'f9c731f4-5b89-4ff7-9fd3-6e5d6ba27a37'
PENDING = '1deb30a4-6135-4bb8-ac53-40dafc049495'
COLLAB_DELIVERED = '09df288f-2805-440a-8c1e-2df7c818a315'
COLLAB_PAID = '331507ab-6094-4be8-82ac-3e5c212a8b00'
DELIV = '2049dd37-1959-41b9-8435-bc002a3d0e01'

SCREENS = {
    'brand': [
        ('brand-dashboard', '/brand/dashboard'),
        ('brand-briefs', '/brand/briefs'),
        ('brand-brief-new', '/brand/briefs/new'),
        ('brand-brief-detail', f'/brand/briefs/{LIVE}'),
        ('brand-brief-edit', f'/brand/briefs/{DRAFT}/edit'),
        ('brand-brief-fund', f'/brand/briefs/{DRAFT}/fund'),
        ('brand-brief-fund-pending', f'/brand/briefs/{PENDING}/fund'),
        ('brand-brief-proposals', f'/brand/briefs/{LIVE}/proposals'),
        ('brand-proposals', '/brand/proposals'),
        ('brand-collab-delivered', f'/brand/collaborations/{COLLAB_DELIVERED}'),
        ('brand-collab-paid', f'/brand/collaborations/{COLLAB_PAID}'),
        ('brand-review', f'/brand/deliverables/{DELIV}/review'),
        ('brand-chats', '/brand/chats'),
        ('brand-profile', '/brand/profile'),
        ('brand-billing', '/brand/billing'),
        ('brand-notifications', '/notifications'),
        ('brand-settings', '/settings'),
    ],
    'creator': [
        ('creator-home', '/creator/home'),
        ('creator-discover', '/creator/discover'),
        ('creator-discover-detail', f'/creator/discover/{LIVE}'),
        ('creator-proposals', '/creator/proposals'),
        ('creator-work', '/creator/work'),
        ('creator-work-detail', f'/creator/work/{COLLAB_DELIVERED}'),
        ('creator-earnings', '/creator/earnings'),
        ('creator-profile', '/creator/profile'),
        ('creator-chats', '/creator/chats'),
        ('creator-notifications', '/notifications'),
        ('creator-settings', '/settings'),
    ],
    'brand-ar': [
        ('ar-brand-dashboard', '/brand/dashboard'),
        ('ar-brand-brief-new', '/brand/briefs/new'),
        ('ar-brand-brief-proposals', f'/brand/briefs/{LIVE}/proposals'),
    ],
    'creator-ar': [
        ('ar-creator-home', '/creator/home'),
        ('ar-creator-discover-detail', f'/creator/discover/{LIVE}'),
        ('ar-creator-work-detail', f'/creator/work/{COLLAB_DELIVERED}'),
    ],
    'public': [
        ('login', '/login'),
    ],
}

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'audit')
os.makedirs(out, exist_ok=True)
roles = sys.argv[1:] or list(SCREENS)
for role in roles:
    env = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONUTF8='1', UICHECK_WAIT_MS='2500')
    if role != 'public':
        st = role.replace('-ar', '') + ('-ar' if role.endswith('-ar') else '')
        env['UICHECK_STATE'] = os.path.join(here, f'state-{st}.json')
    for name, path in SCREENS[role]:
        d = os.path.join(out, name)
        os.makedirs(d, exist_ok=True)
        r = subprocess.run([sys.executable, os.path.join(here, 'uicheck_auth.py'), BASE + path,
                            '--json', os.path.join(d, 'checks.json'), '--shots', d, '--quiet'],
                           env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
        open(os.path.join(d, 'summary.txt'), 'w', encoding='utf-8').write(r.stdout + r.stderr[-2000:])
        print(name, 'ok' if r.returncode == 0 else f'exit {r.returncode}', flush=True)
