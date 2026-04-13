# SBA Demo Dataset

This seed is built to create a fast "this is my operation" reaction for seasonal rental operators.

The default story is not generic task management. It is turnover readiness under time pressure:
- workers coordinated by SMS
- named Cape Cod properties
- readiness proof with photos
- manager verification
- overdue risk
- repeat operational failures that show up in analytics

## Running The Demo Seed

Use the standard Prisma seed command:

```bash
npm run db:seed
```

What the seed is designed to show immediately:
- At Risk Turnovers
- Due Today
- Ready Awaiting Verification
- Verified with Proof
- Overdue

The default live-demo login remains:
- `jordan@driftlinehomes.com / demo1234`

## Default Org First

Start the demo in `Driftline Vacation Homes`.

Why this org:
- It matches the core target segment best: 28 properties, 10 workers, 2 managers, 1 supervisor.
- It has the fullest spread of visible states on the readiness board.
- It is on `PRO`, so analytics, readiness reports, and external proof flows are available.
- The seeded issues are realistic but not catastrophic: towel shortages, missing proof photo, trash overflow, late reassignment, and a documented dishwasher problem.

Login:
- `jordan@driftlinehomes.com / demo1234`

## Organization Design

### 1. Pine Tide Cottage Co.
- Archetype: small operator
- Scale: 8 properties, 1 manager, 1 supervisor, 5 workers
- Feel: still text-and-spreadsheet driven, but starting to formalize readiness
- Demo value: easy for the 5-10 property buyer to identify with

### 2. Driftline Vacation Homes
- Archetype: mid-size operator
- Scale: 28 properties, 2 managers, 1 supervisor, 10 workers
- Feel: busy Friday / Saturday turnover operation with enough complexity to break manual processes
- Demo value: strongest all-around live demo account

### 3. Blue Harbor Collection
- Archetype: large boutique operator
- Scale: 64 properties, 2 managers, 1 supervisor, 15 workers
- Feel: portfolio-level coordination across clusters and flagships
- Demo value: proves SBA scales beyond a handful of homes

### 4. Shoreline Reserve
- Archetype: premium / high-end operator
- Scale: 9 properties, 1 manager, 1 supervisor, 6 workers
- Feel: lower property count, much higher owner expectations
- Demo value: shows verification, proof, and owner trust as the product's differentiator

## Naming Conventions

### Organizations
- Use polished but believable local brands.
- Format: `[regional cue] + [portfolio brand]`
- Examples:
  - `Driftline Vacation Homes`
  - `Blue Harbor Collection`
  - `Shoreline Reserve`

### Properties
- Use memorable, owner-facing names, not inventory codes.
- Format patterns:
  - `[landmark] + [Cottage|House|Retreat|Bungalow|Manor]`
  - `[brandable phrase] + #unit` for clusters
- Examples:
  - `Harbor View Cottage`
  - `Nauset Dune Escape`
  - `Chatham Bay House`
  - `Seaside Retreat #3`

### Turnovers
- Use arrival-driven titles, because that is how operators think.
- Format: `[day/urgency] Arrival - [guest surname / family]`
- Examples:
  - `Tonight Arrival - Walsh Family`
  - `Saturday Arrival - Porter Family`

### Workers
- Use real first + last names with role diversity across cleaners, resets, and maintenance-oriented staff.

## Checklist Strategy

Five templates are seeded into each organization:
- `Standard Turnover`
- `Deep Clean`
- `Linen & Supply Reset`
- `Damage Inspection`
- `Pre-Arrival Final Check`

Design rules:
- 8-14 items each
- several photo-required steps
- repeat issue titles intentionally reused so analytics can surface patterns
- item titles sound operational, not corporate

Commonly repeated issue items:
- `Restock bath towel sets`
- `Remove all trash and recycling`
- `Upload front-entry proof photo`
- `Confirm grill propane level`

## Example Records

### Organization

```json
{
  "name": "Driftline Vacation Homes",
  "slug": "driftline-vacation-homes",
  "planType": "PRO",
  "subscriptionStatus": "ACTIVE",
  "slaDefaultOffsetHours": 4,
  "verificationRequired": true,
  "brandAccentColor": "#136a5b"
}
```

### User

```json
{
  "name": "Miguel Santos",
  "role": "SUPERVISOR",
  "email": "miguel@driftlinehomes.com"
}
```

### Worker

```json
{
  "name": "Tess Moran",
  "role": "WORKER",
  "phone": "+15085553108",
  "smsOptIn": true
}
```

### Property

Note:
Bedroom count and property type are encoded in `notes` because the current schema does not yet have dedicated fields for them.

```json
{
  "name": "Chatham Bay House",
  "address": "18 Salt Marsh Way, Chatham, MA 02633",
  "notes": "5BR family bayfront home. Luxury arrival standard. Front walk, grill, and upper deck photos required.",
  "slaOffsetHours": 6
}
```

### Turnover

```json
{
  "title": "Tonight Arrival - Walsh Family",
  "property": "Millstone Family House",
  "assignedTo": "Tess Moran",
  "template": "Standard Turnover",
  "status": "IN_PROGRESS",
  "guestArrivalAt": "relative to now",
  "readinessScore": 42
}
```

### SMS Log

```json
{
  "to": "+15085553108",
  "status": "delivered",
  "provider": "twilio",
  "body": "Reassigned: Millstone Family House is now yours. Trash barrels still out and arrival is tight."
}
```

### Turnover Readiness Report Example

```json
{
  "turnover": "Friday Arrival - Porter Family",
  "property": "Cedar Point Cottage",
  "status": "VERIFIED",
  "proof": "photo-backed",
  "verifiedBy": "Miguel Santos",
  "slaStatus": "on-time"
}
```

## Core Storylines Seeded

### 1. Missing towels
- `Nauset Dune Escape`
- `Restock bath towel sets` is skipped with a note about missing clean sets
- Demo value: operators instantly recognize the "cleaning complete, but not guest-ready" problem

### 2. Broken appliance documented during turnover
- `Wellfleet Harbor Loft`
- dishwasher quick cycle is skipped with an `E24` note and photo evidence
- Demo value: SBA is not just cleaning status; it captures operational truth

### 3. Missing proof photo
- `Ocean Bluff Bungalow`
- front-entry photo is skipped because the worker lost signal
- Demo value: the app shows why verification exists

### 4. Late completion / not actually ready
- `Oyster Bend Cottage`
- turnover is marked `READY` but late, with a towel exception logged
- Demo value: readiness and timeliness are both visible

### 5. Last-minute reassignment
- `Millstone Family House`
- assignment moves from Marco Silva to Tess Moran
- matching SMS and activity trail are seeded
- Demo value: proves SBA handles the real-world scramble

### 6. Repeat issue pattern
- towel shortages and trash failures recur across different homes
- analytics can surface those repeated misses
- Demo value: this shifts the conversation from "tracking tasks" to "fixing recurring chaos"

## Wow Moments

### Dashboard
- The board opens with a believable mix: upcoming, in-progress, ready, overdue, verified.
- The overdue column is populated, not empty.
- Readiness percentages vary, so cards feel alive rather than fake-perfect.

### Turnover detail
- Open `Tonight Arrival - Walsh Family` or `Tomorrow Arrival - Ross Family`.
- You immediately see SMS assignment history, incomplete proof, notes, and the exact item causing risk.

### Proof
- Open a verified turnover such as `Friday Arrival - Porter Family`.
- The checklist includes proof photos and a verification timestamp.

### Analytics
- Repeat issues are visible because the seed intentionally reuses exact issue titles.
- Worker consistency scores create a coaching conversation, not just a reporting screen.

### Readiness Reports
- Verified turnovers are already available for the "send proof to owner" story.
- Premium and mid-size orgs both support this moment.

## Ideal 3-Minute Demo Walkthrough

### 0:00-0:45
- Start on the readiness board in `Driftline Vacation Homes`.
- Say: "This is Friday afternoon. Some homes are on track, some are still in the field, one is overdue, and a few are already owner-ready."
- Point at the overdue and ready columns immediately.

### 0:45-1:30
- Open `Tonight Arrival - Walsh Family`.
- Show:
  - reassignment trail
  - worker SMS context
  - trash still out
  - missing final proof photo
- Say: "This is the chaos operators usually handle by text and memory."

### 1:30-2:10
- Open `Friday Arrival - Porter Family` or `Saturday Arrival - Dyer Family`.
- Show:
  - completed checklist
  - proof photos
  - manager verification
  - readiness report / export path
- Say: "Now the owner conversation changes from trust me to here's the proof."

### 2:10-2:40
- Jump to analytics.
- Point out repeat issues:
  - towel shortages
  - trash / proof misses
- Say: "This is how you stop fighting the same fires every weekend."

### 2:40-3:00
- Optional close with `Shoreline Reserve`.
- Show that high-end homes use the same system, but with stricter proof and verification expectations.

## Demo Path Recommendations

Best first path:
1. Readiness board
2. Overdue or problematic turnover detail
3. Verified turnover with proof
4. Analytics
5. Readiness reports / external proof

Best supporting accounts:
- `Pine Tide Cottage Co.` when the prospect has fewer than 10 homes
- `Blue Harbor Collection` when they challenge scale
- `Shoreline Reserve` when they care about owner trust and luxury standards

## Intentional Design Principles

- Not every turnover is perfect.
- Not every issue blocks readiness.
- Proof is visible, not implied.
- Workers feel like real seasonal staff, not placeholders.
- Properties sound like owner-facing inventory, not database rows.
- The dataset creates operational tension in under 60 seconds.
