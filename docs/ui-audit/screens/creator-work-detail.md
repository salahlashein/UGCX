# Creator — Work detail (deliver)

**Route:** `/creator/work/[id]` · **Code:** `apps/web/src/app/creator/work/[id]/page.tsx`
**Screenshots:** [1280](../shots/creator-work-detail-1280.png) · [768](../shots/creator-work-detail-768.png) · [360](../shots/creator-work-detail-360.png) · [Arabic 1280](../shots/ar-creator-work-detail-1280.png)
**Score:** `100 − 8 − (3×4) = 80/100` · **Verdict:** Do not ship (G1: at 360 the upload panel covers the brief, which runs one word per line)
**Also affected by:** G1 (`:293`), G5, G9 ("DELIVERED" vs "IN REVIEW")

## Critical (1)

**C1. Upload form still shown after V1 was sent**
**Found:** V1 is delivered and waiting for the brand ("V1 sent" in the stepper), yet the right column still shows an empty "Upload deliverable" box, notes field and "Submit deliverable". The sent video isn't shown, and nothing says "waiting for the brand".
**Why:** creators upload again or think the first upload failed; the next step is unclear.
**Fix:** state-driven panel — delivered: "V1 sent 25 Nov · with Nile Coffee for review" + the video and note; revision requested: the brand's feedback + upload V2; approved: "Approved, payout in progress"; paid: "Paid on … to InstaPay".

## Warning (3)

**W1. "DUE: IN 5 DAYS" after delivery,** in a warning colour. Hide or replace with "Delivered".
**W2. Checklist covers only the talking points.** "Do not mention other coffee brands" isn't there. Also check whether ticks are saved (Verify).
**W3. Three chip styles in one header row** (solid "DELIVERED", dashed orange "DUE", dashed green "REVISION 0 OF 2"). One chip style; revisions as plain text.

## Fix checklist
- [x] C1 state-driven delivery panel
- [ ] W1–W3
