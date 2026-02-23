# UX Guidelines — SBA

## Design Principles

1. **Zero training for workers** — If a field worker needs to read instructions, we failed.
2. **Mobile-first** — Assume 375px width, outdoor lighting, one hand, gloves possible.
3. **Speed over features** — Every tap should feel instant. No loading spinners that last >300ms.
4. **Relationship language** — "Hi Mike!" not "Worker ID 4a2b..."

## Manager UI

- **Desktop**: Sidebar nav + content area
- **Mobile**: Bottom tab bar (4 key sections)
- Tables for data-dense views (properties, work orders, workers)
- Cards for overview and status
- Inline forms (no modal dialogs) to avoid z-index issues on mobile

## Worker Mobile View (/w/[token])

### Layout
- Full-width, no sidebar, no login UI
- Max-width 640px centered
- Large header: property name + work order title

### Checklist Items
- Each item: minimum 72px height (comfortable thumb tap)
- Checkbox on left (40×40px tap area)
- Title centered (18px, readable outdoors)
- Camera icon on right (accessible)
- Completed items: green background, strikethrough text

### Interactions
- Tap checkbox → immediate visual feedback → async PATCH
- If offline: OfflineBanner appears at top, taps queue visually (future enhancement)
- All done → "✅ All Done! Great work." full-screen card

### Photo Upload
- `<input capture="environment">` opens rear camera on iOS/Android
- Badge shows photo count per item
- Max 10MB, images only

## Color / Status Convention

| Status | Color |
|---|---|
| PENDING | Warning (amber) |
| IN_PROGRESS | Primary (blue) |
| COMPLETED | Success (green) |
| CANCELLED | Surface (gray) |

## Accessibility

- All interactive elements have `aria-label`
- Focus rings on buttons (focus-visible)
- Semantic HTML (`<label>`, `<table>`, `<nav>`)
- Sufficient color contrast (Skeleton UI defaults meet WCAG AA)
