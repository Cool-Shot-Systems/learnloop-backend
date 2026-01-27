# Moderation and Quality Control - Phase 8

## Overview

LearnLoop includes a basic moderation system to maintain content quality and handle inappropriate content. The system uses a community-driven reporting approach with automatic soft-hiding and admin review capabilities.

## Core Philosophy

- **Human-first moderation**: No AI-based content moderation
- **Reversible actions**: All moderation is soft (content is hidden, not deleted)
- **Community-driven**: Users report content, automatic hiding at threshold
- **Admin oversight**: Admins review reports and can override decisions

## Report System

### Report Content

**Endpoint**: `POST /api/reports`

**Authentication**: Required

**Rate Limit**: 10 reports per hour

**Request Body**:
```json
{
  "postId": 123,        // OR commentId (exactly one required)
  "commentId": 456,     // OR postId (exactly one required)
  "reason": "SPAM",     // Required: see Report Reasons below
  "details": "Optional additional context"
}
```

**Report Reasons**:
- `SPAM` - Unwanted promotional content or repetitive posts
- `INAPPROPRIATE` - Content that violates community guidelines
- `HARASSMENT` - Bullying or targeted harassment
- `MISINFORMATION` - Factually incorrect information
- `OFF_TOPIC` - Content not related to learning
- `OTHER` - Other issues (please provide details)

**Response** (201):
```json
{
  "message": "Report submitted successfully",
  "report": {
    "id": 789,
    "postId": 123,
    "reason": "SPAM",
    "createdAt": "2026-01-27T09:00:00.000Z"
  }
}
```

**Errors**:
- `400` - Invalid request (must provide exactly one of postId or commentId)
- `403` - Cannot report your own content
- `404` - Content not found or deleted
- `409` - Already reported this content
- `429` - Rate limit exceeded

### Rules and Behavior

1. **No Self-Reporting**: Users cannot report their own content
2. **No Duplicate Reports**: Each user can only report a piece of content once
3. **Automatic Hiding**: Content is automatically hidden when it reaches 5 reports
4. **Transaction Safety**: Report creation and auto-hiding happen atomically

### Auto-Hide Threshold

When content receives **5 or more reports**, it is automatically hidden from public view:
- Hidden content is excluded from all public listings
- Authors can still see their own hidden content
- Admins can see all content regardless of hidden status
- Content remains in the database (not deleted)

## Admin Moderation

All admin endpoints require:
1. Authentication (`requireAuth` middleware)
2. Admin privileges (`requireAdmin` middleware)

### List Reports

**Endpoint**: `GET /api/admin/reports`

**Query Parameters**:
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200):
```json
{
  "reports": [
    {
      "id": 1,
      "reporterId": "user-uuid",
      "postId": 123,
      "commentId": null,
      "reason": "SPAM",
      "details": "Repeated promotional content",
      "createdAt": "2026-01-27T09:00:00.000Z",
      "reporter": {
        "id": "user-uuid",
        "username": "john_doe"
      },
      "post": {
        "id": 123,
        "title": "Check out my website",
        "isHidden": true,
        "author": {
          "id": "author-uuid",
          "username": "spammer"
        }
      },
      "comment": null,
      "totalReports": 6
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### View Report Details

**Endpoint**: `GET /api/admin/reports/:id`

**Response** (200):
```json
{
  "report": {
    "id": 1,
    "reporterId": "user-uuid",
    "postId": 123,
    "reason": "SPAM",
    "details": "Repeated promotional content",
    "createdAt": "2026-01-27T09:00:00.000Z",
    "reporter": {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "post": {
      "id": 123,
      "title": "Check out my website",
      "content": "Full post content...",
      "isHidden": true,
      "deletedAt": null,
      "author": {
        "id": "author-uuid",
        "username": "spammer",
        "email": "spammer@example.com"
      }
    }
  },
  "allReports": [
    // All reports for this content
  ],
  "totalReports": 6
}
```

### Unhide Content

**Endpoint**: `POST /api/admin/reports/:id/unhide`

Unhides content without deleting reports. Use this when you've reviewed the content and determined it doesn't violate guidelines.

**Response** (200):
```json
{
  "message": "Post unhidden successfully",
  "postId": 123
}
```

### Dismiss Reports

**Endpoint**: `POST /api/admin/reports/:id/dismiss`

Deletes all reports for a piece of content AND unhides it. Use this when reports are invalid or frivolous.

**Response** (200):
```json
{
  "message": "All reports dismissed and content unhidden",
  "postId": 123,
  "commentId": null
}
```

## Visibility Rules

### For Public Users (Not Authenticated)

- Hidden posts/comments are NOT visible
- Cannot see any hidden content

### For Authenticated Users

- Hidden content created by others is NOT visible
- Own hidden content IS visible (so authors know their content was hidden)
- Can report content (but not own content)

### For Content Authors

- Can see their own hidden content in all contexts
- Receive no special notification that content is hidden
- Can still edit/delete their hidden content

### For Admins

- Can see ALL content (hidden or not)
- Can view all reports
- Can unhide content
- Can dismiss reports

## Database Schema

### Report Model

```prisma
model Report {
  id        Int          @id @default(autoincrement())
  reporterId String      @db.Uuid
  postId    Int?
  commentId Int?
  reason    ReportReason
  details   String?      @db.Text
  createdAt DateTime     @default(now())

  reporter User     @relation(fields: [reporterId], references: [id], onDelete: Cascade)
  post     Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment  Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([reporterId, postId])
  @@unique([reporterId, commentId])
}
```

### Content Models (Updated)

Posts and Comments now have:
- `isHidden Boolean @default(false)` - Soft hide flag
- Index on `isHidden` for efficient filtering

Users now have:
- `isAdmin Boolean @default(false)` - Admin privilege flag

## Implementation Notes

### Why Soft Hide Instead of Delete?

1. **Reversibility**: Mistakes can be undone
2. **Learning**: Users can learn from moderated content
3. **Transparency**: Authors can see what was flagged
4. **Evidence**: Preserves content for pattern analysis

### Why 5 Reports Threshold?

- Low enough to catch obvious violations quickly
- High enough to prevent single-user abuse
- Can be adjusted if needed based on community size

### Transaction Safety

All report creation with auto-hiding uses Prisma transactions:
```javascript
await prisma.$transaction(async (tx) => {
  // Create report
  const report = await tx.report.create({...});
  
  // Count reports
  const count = await tx.report.count({...});
  
  // Auto-hide if threshold reached
  if (count >= 5) {
    await tx.post.update({ data: { isHidden: true } });
  }
});
```

## Best Practices

### For Users

1. **Report Appropriately**: Only report content that genuinely violates guidelines
2. **Provide Context**: Use the details field to explain why you're reporting
3. **Don't Abuse**: Frivolous reports may result in action against your account

### For Admins

1. **Review Promptly**: Check reported content regularly
2. **Be Fair**: Consider context before making decisions
3. **Document**: Use report details to understand patterns
4. **Communicate**: If implementing this, consider adding user notifications

## Future Enhancements (Not in Phase 8)

- User notification when content is hidden
- Appeal process for hidden content
- Admin audit log
- Configurable report threshold
- Report statistics and analytics
- Temporary content removal (time-based unhiding)
- User reputation impact from reports

## Testing

### Report Content

```bash
# Report a post
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": 1,
    "reason": "SPAM",
    "details": "This is promotional content"
  }'

# Report a comment
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentId": 5,
    "reason": "HARASSMENT"
  }'
```

### Admin Actions

```bash
# List reports (admin only)
curl http://localhost:3000/api/admin/reports \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# View report details
curl http://localhost:3000/api/admin/reports/1 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Unhide content
curl -X POST http://localhost:3000/api/admin/reports/1/unhide \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Dismiss all reports
curl -X POST http://localhost:3000/api/admin/reports/1/dismiss \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Security Considerations

1. **Admin Privilege**: Only grant admin status to trusted users
2. **Rate Limiting**: Report endpoint is rate-limited to prevent spam
3. **Self-Reporting**: Blocked to prevent abuse
4. **Duplicate Prevention**: Database constraints prevent duplicate reports
5. **Atomic Operations**: Transactions ensure data consistency

## Error Handling

All moderation endpoints follow standard error response format:

```json
{
  "error": "Error message",
  "message": "Additional context"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Report created
- `400` - Bad request (validation error)
- `401` - Authentication required
- `403` - Forbidden (admin required or self-reporting)
- `404` - Content not found
- `409` - Conflict (duplicate report)
- `429` - Rate limit exceeded
- `500` - Server error
