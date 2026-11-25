# Settings (brand and creator)

**Route:** `/settings` · **Code:** `apps/web/src/app/settings/page.tsx`
**Screenshots:** brand [1280](../shots/brand-settings-1280.png) · [360](../shots/brand-settings-360.png) · creator [1280](../shots/creator-settings-1280.png) · [360](../shots/creator-settings-360.png)
**Score:** `100 − (2×4) = 92/100` · **Verdict:** Ready to ship
**Also affected by:** G3 (not reachable on phones), G12 (narrow centred container), G15 (language and Log out duplicated in the sidebar), G18

## Warning (2)

**W1. A read-only row looks like a field.** "Layout direction · Left-to-Right (LTR)" sits in a bordered box like an input but can't be changed. Show it as plain helper text under the language switch ("Arabic switches the layout to right-to-left").
**W2. "Security" card with nothing to do.** It states "Email one-time code · …" with no action. Either add useful controls (sign out of other devices, change email) or merge it into the account card.

## Verify
- The pencil next to the name: does it edit the display name here or jump to the profile? Label it.
