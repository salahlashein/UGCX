# Login / sign up

**Route:** `/login` · **Code:** `apps/web/src/app/(auth)/login/page.tsx`, `apps/api/src/modules/auth/auth.service.ts`
**Screenshots:** [1280](../shots/login-1280.png) · [768](../shots/login-768.png) · [360](../shots/login-360.png)
**Score:** `100 − 8 − 4 = 88/100` · **Verdict:** Ship after fixing C1
**Also affected by:** G16 ("U" logo, "Creator videos · Escrow" tagline), G11

## Critical (1)

**C1. "Use password instead" can never work for real users**
**Found:** every account is created by email code (`verifyOtp` creates the user without a password hash), so the password form always fails with "Invalid credentials". Only the seeded demo accounts have passwords.
**Fix:** remove the password option (or keep it behind the dev flag with the demo shortcuts), until a "set a password" flow exists.

## Warning (1)

**W1. No context for a first-time visitor.** `/` redirects here; someone arriving from an ad or a creator DM sees only "ReelPal · Creator videos · Escrow" and a form. Add one line per side ("Brands: get UGC videos, pay only when you approve" / "Creators: get paid for videos, money held safely") and links to Terms and Privacy — until the landing page (board task s4-02) exists.

## Good
- Role switch is full width; label changes by role ("Work email" for brands); 6-box code input; resend timer.

## Verify
- Pasting a 6-digit code into the first box fills all six.
- The dev/test shortcuts block is hidden in production (it is in `next dev` only; confirm on the deployed build).
