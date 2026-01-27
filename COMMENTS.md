# Phase 4: Comments API

This document covers the Comments implementation for LearnLoop backend.

## Overview

Phase 4 implements full CRUD operations for comments on posts. Comments allow users to provide clarifications and questions on learning content with a minimum length requirement.

## Comments Model

Comments are simple, non-threaded responses to posts:
- Minimum 20 characters
- Belong to exactly one post
- Can be edited and deleted by author
- Hard delete (removed from database)

## Validation Rules

1. **Content:** Minimum 20 characters (enforced at API level)
2. **Post:** Must belong to an existing, non-deleted post
3. **Author:** Automatically set from authenticated user

## Endpoints

### Create Comment
```
POST /api/comments
Authorization: ******
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "This is a great explanation of closures! One question though - how do closures interact with async/await?",
  "postId": 1
}
```

**Response (201):**
```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": 1,
    "content": "This is a great explanation of closures! One question though - how do closures interact with async/await?",
    "authorId": "user-uuid",
    "postId": 1,
    "createdAt": "2026-01-27T08:00:00.000Z",
    "author": {
      "id": "user-uuid",
      "username": "johndoe",
      "learningScore": 0
    }
  }
}
```

**Response (400) - Too Short:**
```json
{
  "error": "Comment must be at least 20 characters long (currently 15 characters)"
}
```

**Response (404) - Post Not Found:**
```json
{
  "error": "Post not found"
}
```

### List Comments for Post
```
GET /api/posts/:postId/comments?limit=50&offset=0
```

Returns comments for a specific post, ordered by creation time (oldest first).

**Query Parameters:**
- `limit` (optional): Number of comments (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "comments": [
    {
      "id": 1,
      "content": "This is a great explanation of closures!",
      "authorId": "user-uuid",
      "postId": 1,
      "createdAt": "2026-01-27T08:00:00.000Z",
      "author": {
        "id": "user-uuid",
        "username": "johndoe",
        "learningScore": 0
      },
      "_count": {
        "votes": 5
      }
    },
    {
      "id": 2,
      "content": "Can you provide more examples of closure use cases?",
      "authorId": "another-uuid",
      "postId": 1,
      "createdAt": "2026-01-27T09:00:00.000Z",
      "author": {
        "id": "another-uuid",
        "username": "janedoe",
        "learningScore": 10
      },
      "_count": {
        "votes": 2
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Response (404) - Post Not Found:**
```json
{
  "error": "Post not found"
}
```

### Get Single Comment
```
GET /api/comments/:id
```

**Response (200):**
```json
{
  "comment": {
    "id": 1,
    "content": "This is a great explanation of closures!",
    "authorId": "user-uuid",
    "postId": 1,
    "createdAt": "2026-01-27T08:00:00.000Z",
    "author": {
      "id": "user-uuid",
      "username": "johndoe",
      "learningScore": 0,
      "createdAt": "2026-01-20T08:00:00.000Z"
    },
    "post": {
      "id": 1,
      "title": "Understanding JavaScript Closures",
      "authorId": "post-author-uuid"
    },
    "_count": {
      "votes": 5
    }
  }
}
```

**Response (404):**
```json
{
  "error": "Comment not found"
}
```

### Update Comment
```
PUT /api/comments/:id
Authorization: ******
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "This is a great explanation of closures! One question though - how do closures interact with async/await functions?"
}
```

**Response (200):**
```json
{
  "message": "Comment updated successfully",
  "comment": {
    "id": 1,
    "content": "This is a great explanation of closures! One question though - how do closures interact with async/await functions?",
    "authorId": "user-uuid",
    "postId": 1,
    "createdAt": "2026-01-27T08:00:00.000Z",
    "author": {
      "id": "user-uuid",
      "username": "johndoe",
      "learningScore": 0
    }
  }
}
```

**Response (403) - Not Owner:**
```json
{
  "error": "You can only update your own comments"
}
```

**Response (400) - Too Short:**
```json
{
  "error": "Comment must be at least 20 characters long (currently 15 characters)"
}
```

### Delete Comment
```
DELETE /api/comments/:id
Authorization: ******
```

**Hard delete** - comment is permanently removed from the database.

**Response (200):**
```json
{
  "message": "Comment deleted successfully"
}
```

**Response (403) - Not Owner:**
```json
{
  "error": "You can only delete your own comments"
}
```

**Response (404):**
```json
{
  "error": "Comment not found"
}
```

## Features

### Content Validation

All comment content is validated:

1. **Minimum Length:**
   - At least 20 characters required
   - Whitespace trimmed before validation
   - Applied on create and update

2. **Post Validation:**
   - Post must exist
   - Post must not be soft-deleted
   - Returns 404 if post not found

### Ownership & Authorization

Comment updates and deletes require:
1. User must be authenticated (valid JWT token)
2. User must be the comment author (ownership check)

Uses the `isOwner()` helper from auth middleware:
```javascript
if (!isOwner(req.user.id, comment.authorId)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Hard Delete

Unlike posts (which use soft delete), comments are **hard deleted**:
- Comment is permanently removed from database
- Related votes are cascade-deleted automatically
- No recovery option

**Rationale:** Comments are less critical than posts and don't need soft delete overhead.

### Ordering

Comments are ordered by `createdAt` in **ascending order** (oldest first):
- Allows readers to follow the conversation chronologically
- New comments appear at the bottom
- Consistent with typical forum/discussion thread behavior

### Pagination

All list endpoints support pagination:
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Skip N results (default: 0)
- Response includes `hasMore` boolean

Default limit is higher for comments (50) than posts (20) since comments are typically shorter.

## API Routes Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/comments` | Yes | Create comment |
| GET | `/api/posts/:postId/comments` | No | List comments for post |
| GET | `/api/comments/:id` | No | Get single comment |
| PUT | `/api/comments/:id` | Yes (owner) | Update comment |
| DELETE | `/api/comments/:id` | Yes (owner) | Delete comment |

## Error Responses

All endpoints return consistent error responses:

**400 - Bad Request:**
```json
{
  "error": "Comment must be at least 20 characters long (currently 15 characters)"
}
```

**401 - Unauthorized:**
```json
{
  "error": "No authorization token provided"
}
```

**403 - Forbidden:**
```json
{
  "error": "You can only update your own comments"
}
```

**404 - Not Found:**
```json
{
  "error": "Comment not found"
}
```

**500 - Internal Server Error:**
```json
{
  "error": "Internal server error while creating comment"
}
```

## Examples

### Creating a Comment

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: ******" \
  -d '{
    "content": "Great explanation! Could you elaborate on the memory implications?",
    "postId": 1
  }'
```

### Listing Comments

```bash
curl http://localhost:3000/api/posts/1/comments?limit=20&offset=0
```

### Updating a Comment

```bash
curl -X PUT http://localhost:3000/api/comments/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: ******" \
  -d '{
    "content": "Great explanation! Could you elaborate more on the memory implications of closures?"
  }'
```

### Deleting a Comment

```bash
curl -X DELETE http://localhost:3000/api/comments/1 \
  -H "Authorization: ******"
```

## What's NOT Included

Phase 4 is Comments only. The following are NOT implemented:
- ❌ Voting on comments (Phase 5)
- ❌ Nested/threaded comments
- ❌ Comment notifications
- ❌ Comment moderation
- ❌ Edit history
- ❌ Soft delete for comments
- ❌ Comment reactions

## Database Schema Notes

No schema changes were made in Phase 4. The existing Comment model from Phase 1 is used:

- **Comments** table has required fields
- Foreign key to `postId` with CASCADE delete
- Foreign key to `authorId` with CASCADE delete
- Indexes on authorId, postId, createdAt for query optimization

## Security

- ✅ All inputs sanitized (trimmed)
- ✅ SQL injection prevented by Prisma parameterization
- ✅ Authentication required for create, update, delete
- ✅ Ownership verified before updates/deletes
- ✅ Post existence validated before comment creation

## Next Steps

Phase 5 will implement:
- Voting system (upvotes only on posts and comments)
- Saved posts functionality
- Additional filtering and sorting options
