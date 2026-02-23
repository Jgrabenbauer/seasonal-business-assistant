# Storage

## Providers
- `local` (default): writes to `static/uploads`
- `s3`: S3-compatible storage with presigned PUT uploads

## Env Vars (S3)
- `STORAGE_PROVIDER=s3`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT` (optional, for S3-compatible services)
- `S3_FORCE_PATH_STYLE` (optional, for MinIO)

## Upload Flow
1. Client calls `POST /api/uploads/presign`
2. Client uploads directly to S3 via presigned URL
3. Client calls `POST /api/uploads/complete` to record Attachment

## Validation
- Image-only uploads
- Max 10MB
