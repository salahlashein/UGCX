# Chats (brand and creator)

**Routes:** `/brand/chats`, `/creator/chats` · **Code:** `apps/web/src/app/{brand,creator}/chats/page.tsx` (shared chat components)
**Screenshots:** brand [1280](../shots/brand-chats-1280.png) · [360](../shots/brand-chats-360.png) · creator [1280](../shots/creator-chats-1280.png) · [360](../shots/creator-chats-360.png)
**Score:** `100 − 4 = 96/100` · **Verdict:** Ready to ship
**Also affected by:** G6 ("Search chats..." has no label), G7, G9 (status chip "DELIVERED")

## Warning (1)

**W1. System events inside the conversation.** "Campaign escrow funded" and "Creator submitted deliverable" appear as centred bubbles among the messages; for the creator, "Campaign escrow funded" is noise. Keep only events that matter to both sides (hired, V1 sent, revision requested, approved, paid), styled as a quiet divider with a date.

## Verify
- At 360, tapping a conversation opens the thread full screen with a back button (only the list was captured).

## Good
- Clear two-pane layout on desktop, job context (escrow, Job details) in the thread header, sensible empty send button state.
