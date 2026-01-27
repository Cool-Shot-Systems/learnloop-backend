# Saved Posts API Documentation

Phase 6: Saved Posts (Bookmarks for revision)

## Overview

The Saved Posts API allows users to bookmark posts for later review. Users can save posts they find valuable, view their saved collection, and remove bookmarks when no longer needed.

## Endpoints

### 1. Save a Post

Save a post to your bookmarks for later review.

**Endpoint:** `POST /api/saved-posts`

**Authentication:** Required

**Request Body:**
```json
{
  "postId": 123
}
```

**Success Response (201):**
```json
{
  "message": "Post saved successfully",
  "savedPost": {
    "savedAt": "2024-01-15T10:30:00.000Z",
    "post": {
      "id": 123,
      "title": "Understanding Recursion",
      "content": "Recursion is a programming technique...",
      "authorId": "uuid-here",
      "primaryTopicId": 1,
      "createdAt": "2024-01-10T08:00:00.000Z",
      "deletedAt": null,
      "author": {
        "id": "uuid-here",
        "username": "john_doe",
        "learningScore": 150
      },
      "primaryTopic": {
        "id": 1,
        "name": "Computer Science",
        "description": "Topics related to computer science"
      }
    }
  }
}
```

**Error Responses:**

- **400 Bad Request:** Post ID missing or post is deleted
```json
{
  "error": "Post ID is required"
}
```

- **404 Not Found:** Post doesn't exist
```json
{
  "error": "Post not found"
}
```

- **409 Conflict:** Post already saved
```json
{
  "error": "Post already saved",
  "savedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Get Saved Posts

Retrieve all posts saved by the current user.

**Endpoint:** `GET /api/saved-posts`

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Example Request:**
```
GET /api/saved-posts?limit=10&offset=0
```

**Success Response (200):**
```json
{
  "savedPosts": [
    {
      "savedAt": "2024-01-15T10:30:00.000Z",
      "post": {
        "id": 123,
        "title": "Understanding Recursion",
        "content": "Recursion is a programming technique...",
        "authorId": "uuid-here",
        "primaryTopicId": 1,
        "createdAt": "2024-01-10T08:00:00.000Z",
        "deletedAt": null,
        "author": {
          "id": "uuid-here",
          "username": "john_doe",
          "learningScore": 150
        },
        "primaryTopic": {
          "id": 1,
          "name": "Computer Science",
          "description": "Topics related to computer science"
        },
        "_count": {
          "comments": 5,
          "votes": 12
        }
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Notes:**
- Posts are ordered by `savedAt` (most recent first)
- Soft-deleted posts are automatically excluded
- Includes post details with author, topic, and counts

---

### 3. Check if Post is Saved

Check whether a specific post is saved by the current user.

**Endpoint:** `GET /api/saved-posts/check/:postId`

**Authentication:** Optional (returns false if not authenticated)

**Parameters:**
- `postId`: ID of the post to check

**Example Request:**
```
GET /api/saved-posts/check/123
```

**Success Response (200):**

When authenticated and post is saved:
```json
{
  "isSaved": true,
  "postId": 123,
  "savedAt": "2024-01-15T10:30:00.000Z"
}
```

When authenticated and post is not saved:
```json
{
  "isSaved": false,
  "postId": 123,
  "savedAt": null
}
```

When not authenticated:
```json
{
  "isSaved": false,
  "postId": 123
}
```

**Error Responses:**

- **400 Bad Request:** Invalid post ID
```json
{
  "error": "Invalid post ID"
}
```

---

### 4. Unsave a Post

Remove a post from your saved bookmarks.

**Endpoint:** `DELETE /api/saved-posts/:postId`

**Authentication:** Required

**Parameters:**
- `postId`: ID of the post to unsave

**Example Request:**
```
DELETE /api/saved-posts/123
```

**Success Response (200):**

When post was saved and removed:
```json
{
  "message": "Post unsaved successfully"
}
```

When post was not saved (idempotent behavior):
```json
{
  "message": "Post was not saved or already removed"
}
```

**Error Responses:**

- **400 Bad Request:** Invalid post ID
```json
{
  "error": "Invalid post ID"
}
```

**Notes:**
- This endpoint is idempotent - removing a post that isn't saved won't cause an error
- No validation is performed on whether the post exists

---

## Features

### Validation
- **Post Existence:** Verifies post exists before saving
- **Soft Delete Check:** Cannot save posts that have been deleted
- **Duplicate Prevention:** Unique constraint prevents saving the same post twice
- **Idempotent Unsave:** Removing a non-saved post doesn't error

### Authorization
- **Authentication Required:** Save, list, and unsave operations require authentication
- **Optional Auth:** Check endpoint works with or without authentication
- **User Isolation:** Users can only see and manage their own saved posts

### Pagination
- Default limit: 20 posts
- Maximum limit: 100 posts
- Offset-based pagination for large collections
- `hasMore` indicator for client-side pagination

### Ordering
- Saved posts ordered by `savedAt` timestamp
- Most recently saved posts appear first
- Consistent ordering for pagination

## Use Cases

### Student Workflow
1. **Browse Posts:** Student finds valuable explanatory post
2. **Save for Later:** Bookmarks post for exam revision
3. **Review Collection:** Views all saved posts before exam
4. **Remove Bookmark:** Unsaves post after exam is complete

### Example: Save and Review
```bash
# Save a post
curl -X POST http://localhost:3000/api/saved-posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postId": 123}'

# Check if saved
curl http://localhost:3000/api/saved-posts/check/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all saved posts
curl http://localhost:3000/api/saved-posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Unsave when no longer needed
curl -X DELETE http://localhost:3000/api/saved-posts/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

The SavedPost model uses a composite primary key:

```prisma
model SavedPost {
  userId  String   @db.Uuid
  postId  Int
  savedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
  @@index([userId])
  @@index([postId])
}
```

**Key Features:**
- Composite primary key `(userId, postId)` prevents duplicates
- Cascade delete: Removing user or post removes saved records
- Indexed on both userId and postId for query performance
- `savedAt` timestamp tracks when post was bookmarked

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (save post)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (post doesn't exist)
- `409` - Conflict (duplicate save)
- `500` - Internal Server Error

## Future Enhancements

Not implemented in Phase 6:
- Saved post folders or categories
- Sharing saved collections with other users
- Saved post recommendations
- Export saved posts
- Notes on saved posts
- AI-generated summaries (against platform philosophy)

## Related Endpoints

- **Posts API:** See `POSTS.md` for post creation and management
- **Topics API:** See `POSTS.md` for topic information
- **Authentication:** See `AUTH.md` for login/register
