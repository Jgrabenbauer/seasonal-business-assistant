# Analytics (Lightweight)

## Metrics
- Tasks completed this week
- Average completion time
- Overdue rate
- Worker performance summary
- Most common checklist failures

## Queries
Aggregations are done via Prisma `$queryRaw` in:
`src/routes/dashboard/analytics/+page.server.ts`

## Access
Analytics is available on the Pro plan.

## Indexes
Recommended indexes:
- `WorkOrder.status`
- `WorkOrder.scheduledFor`
- `ChecklistRun.completedAt`
- `ChecklistRun.startedAt`
