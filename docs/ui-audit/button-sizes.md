# Button sizes

One `Button` component (`apps/web/src/components/ui/Button.tsx`) sets the height. The colour (variant) never changes it.

| Size | Height | Use |
|---|---|---|
| `sm` | 38px | Back links, small actions inside a card or a table row |
| `md` (default) | 48px | Page and form actions; same height as a text input |
| `lg` | 52px | One main action on a full-width screen (rare) |

## Rules

1. **Buttons in the same row use the same size.** A light (secondary, ghost) button next to a dark-green (primary) button has the primary's size. Show the main action with colour, not with height.
2. A square icon button next to a `Button` (for example the notifications bell) uses the same height: `sizes.buttonHeight` for `md`.
3. A button stands alone or is the back link → `sm` is fine.
4. Don't set `height`, `minHeight` or `padding` through `style` to resize a button. Pick a size.

## Fixed (Nov 2026)

- Brief detail: "Edit brief" was `sm` (40px) next to "Proposals" (48px).
- Proposals: "Decline" / "Shortlist" were `sm` next to "Accept proposal".
- Creator earnings: "Payout method" was `sm` next to "Request payout".
- Creator home: the bell was 40px next to "Discover briefs" (48px).
