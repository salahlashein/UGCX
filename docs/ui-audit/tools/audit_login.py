"""Logs into the LOCAL web app (dev mode, fixed OTP 000000) and saves the browser state per role."""
import sys
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:3001'
ACCOUNTS = {
    'brand': ('brand.audit@example.com', 'Brand'),
    'creator': ('mariam.audit@example.com', 'Creator'),
}

def login(p, role, out):
    email, tab = ACCOUNTS[role]
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    pg = ctx.new_page()
    pg.goto(BASE + '/login')
    pg.wait_for_load_state('networkidle')
    pg.get_by_role('radio', name=tab).click()
    pg.locator('input[type=email]').first.fill(email)
    pg.get_by_role('button', name='Send verification code').click()
    pg.wait_for_timeout(2500)
    boxes = pg.locator('input[inputmode=numeric], input[autocomplete=one-time-code], input[maxlength="1"]')
    n = boxes.count()
    if n >= 6:
        for i, d in enumerate('000000'):
            boxes.nth(i).fill(d)
    else:
        boxes.first.fill('000000')
    pg.get_by_role('button', name='Verify & continue').click()
    try:
        pg.wait_for_url(lambda u: '/login' not in u, timeout=20000)
    except Exception:
        pg.screenshot(path=f'login-fail-{role}.png'); print(pg.locator('body').inner_text()[:400]); raise
    pg.wait_for_load_state('networkidle')
    print(role, 'logged in ->', pg.url)
    ctx.storage_state(path=out)
    b.close()

if __name__ == '__main__':
    with sync_playwright() as p:
        for role in sys.argv[1:]:
            login(p, role, f'state-{role}.json')
