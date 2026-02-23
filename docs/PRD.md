# Product Requirements Document — SBA

## Problem

Cape Cod seasonal rental operators manage 10–50+ properties with a transient workforce (cleaners, maintenance). Turnover coordination is done via text messages, paper checklists, and verbal instructions — leading to missed tasks, no accountability, and no photo documentation.

## Target Users

1. **Manager / Operator** — Creates work orders, assigns workers, reviews completion. Uses desktop or mobile. Tech-cautious but capable. Needs clear, fast UI.
2. **Field Worker (Cleaner / Maintenance)** — Receives SMS, opens link, completes checklist, takes photos. May have older phone, spotty service. No account required.

## MVP Scope

### Manager can:
- Register organization + account
- Create and manage properties
- Create checklist templates
- Create work orders and assign to workers
- Send worker SMS magic links (or resend)
- View work order status and checklist completion
- View photos taken during completion
- Export work order as PDF
- View SMS outbox

### Worker can:
- Open SMS link on phone (no login)
- View checklist with large, tappable items
- Mark items complete/skipped
- Take and upload photos
- See "All Done!" completion screen

## Out of Scope (MVP)

- Multi-org admin
- Recurring schedules
- Guest-facing communication
- Mobile push notifications
- Worker accounts / login
- Billing / payments

## Success Criteria

- Manager can create + assign a work order in < 2 minutes
- Worker can complete a 8-item checklist in < 5 minutes
- Zero training required for workers
- Works reliably on mobile Safari and Chrome
