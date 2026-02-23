# API Reference — SBA

SvelteKit form actions handle most CRUD. These are the JSON API endpoints.

## PATCH /api/checklist/[runId]/item/[itemId]

Update the status of a checklist item run.

**Auth:** No auth required (accessed by workers via magic link page).

**Request Body:**
```json
{
  "status": "COMPLETED" | "PENDING" | "SKIPPED",
  "notes": "Optional notes string"
}
```

**Response (200):**
```json
{
  "ok": true,
  "item": { "id": "...", "status": "COMPLETED", "completedAt": "..." }
}
```

**Side effects:**
- If all items in the run are non-PENDING: sets `ChecklistRun.completedAt` and `WorkOrder.status = COMPLETED`

**Errors:**
- `400` — Invalid status value
- `404` — Item not found

---

## POST /api/upload

Upload a photo attachment for a checklist item run.

**Auth:** No auth required (accessed by workers).

**Request:** `multipart/form-data`
- `file` — Image file (jpeg, png, webp, heic)
- `itemRunId` — ID of the `ChecklistItemRun`

**Limits:**
- Max file size: 10MB
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`

**Response (200):**
```json
{
  "ok": true,
  "attachment": {
    "id": "...",
    "url": "/uploads/filename.jpg",
    "filename": "IMG_1234.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 2048000
  }
}
```

**Errors:**
- `400` — Missing file or itemRunId
- `413` — File too large
- `415` — Unsupported file type
- `500` — Upload failed

---

## Form Actions

All dashboard CRUD uses SvelteKit form actions (POST to `?/actionName`).

| Route | Action | Description |
|---|---|---|
| `/auth/login` | `default` | Verify credentials, set session cookie |
| `/auth/register` | `default` | Create org + manager, set session cookie |
| `/auth/logout` | `default` | Clear session cookie |
| `/dashboard/properties` | `create` | Create property |
| `/dashboard/work-orders` | `create` | Create work order |
| `/dashboard/work-orders/[id]` | `assign` | Assign worker, generate token, send SMS |
| `/dashboard/work-orders/[id]` | `send_link` | Resend SMS to assigned worker |
| `/dashboard/work-orders/[id]` | `export_pdf` | Generate and download PDF |
| `/dashboard/templates` | `create` | Create checklist template |
| `/dashboard/templates/[id]` | `add_item` | Add item to template |
| `/dashboard/templates/[id]` | `delete_item` | Remove item from template |
| `/dashboard/workers` | `create` | Create worker (no password) |
