# Feed and Discovery API

Phase 9 of the LearnLoop backend implementation.

## Overview

The Feed API provides read-only endpoints for discovering posts through different views. All feeds use simple, transparent ordering logic with no personalization or AI ranking.

**Ordering Logic:**
1. Primary: `createdAt DESC` (most recent first)
2. Secondary: `voteCount DESC` (most upvoted first when posted at same time)

## Features

- ✅ No personalization or algorithmic boosting
- ✅ No AI-based recommendations
- ✅ Transparent, explainable ordering
- ✅ Optional authentication for enriched responses
- ✅ Respects moderation rules (hidden content visibility)
- ✅ Pagination support

## Endpoints

### 1. Home Feed

Get all posts across all topics.

**Endpoint:** `GET /api/feed/home`

**Authentication:** Optional

**Query Parameters:**
- `limit` (optional): Number of posts per page (default: 20, max: 100)
- `offset` (optional): Number of posts to skip (default: 0)

**Visibility Rules:**
- Excludes soft-deleted posts (`deletedAt IS NOT NULL`)
- Excludes hidden posts (`isHidden = true`) for non-admin users
- Admins see all posts including hidden ones

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Understanding React Hooks",
      "content": "React Hooks are functions that let you...",
      "createdAt": "2026-01-27T09:00:00.000Z",
      "author": {
        "id": "uuid-123",
        "username": "johndoe",
        "learningScore": 42
      },
      "primaryTopic": {
        "id": 1,
        "name": "React"
      },
      "voteCount": 15,
      "commentCount": 3,
      "hasVoted": true,
      "isSaved": false,
      "userVoteId": 789,
      "isHidden": false
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Example Request:**
```bash
# Unauthenticated
curl http://localhost:3000/api/feed/home?limit=10&offset=0

# Authenticated (includes hasVoted and isSaved)
curl http://localhost:3000/api/feed/home \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Topic Feed

Get posts filtered by a specific topic.

**Endpoint:** `GET /api/feed/topic/:topicId`

**Authentication:** Optional

**Path Parameters:**
- `topicId` (required): Topic ID (integer)

**Query Parameters:**
- `limit` (optional): Number of posts per page (default: 20, max: 100)
- `offset` (optional): Number of posts to skip (default: 0)

**Visibility Rules:** Same as home feed

**Response:**
```json
{
  "topic": {
    "id": 1,
    "name": "React",
    "description": "React JavaScript library"
  },
  "posts": [
    {
      "id": 1,
      "title": "Understanding React Hooks",
      "content": "React Hooks are functions...",
      "createdAt": "2026-01-27T09:00:00.000Z",
      "author": {
        "id": "uuid-123",
        "username": "johndoe",
        "learningScore": 42
      },
      "primaryTopic": {
        "id": 1,
        "name": "React"
      },
      "voteCount": 15,
      "commentCount": 3,
      "hasVoted": false,
      "isSaved": true,
      "userVoteId": null,
      "isHidden": false
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

**Example Request:**
```bash
# Get React posts
curl http://localhost:3000/api/feed/topic/1?limit=10

# With authentication
curl http://localhost:3000/api/feed/topic/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Error Responses:**
```json
// Topic not found
{
  "error": "Topic not found"
}
```

---

### 3. Author Feed

Get posts by a specific author.

**Endpoint:** `GET /api/feed/author/:authorId`

**Authentication:** Optional

**Path Parameters:**
- `authorId` (required): User ID (UUID)

**Query Parameters:**
- `limit` (optional): Number of posts per page (default: 20, max: 100)
- `offset` (optional): Number of posts to skip (default: 0)

**Visibility Rules:**
- Hidden posts are visible ONLY to:
  - The author themselves
  - Admin users
- Other users don't see hidden posts from this author

**Response:**
```json
{
  "author": {
    "id": "uuid-123",
    "username": "johndoe",
    "learningScore": 42
  },
  "posts": [
    {
      "id": 1,
      "title": "Understanding React Hooks",
      "content": "React Hooks are functions...",
      "createdAt": "2026-01-27T09:00:00.000Z",
      "author": {
        "id": "uuid-123",
        "username": "johndoe",
        "learningScore": 42
      },
      "primaryTopic": {
        "id": 1,
        "name": "React"
      },
      "voteCount": 15,
      "commentCount": 3,
      "hasVoted": false,
      "isSaved": false,
      "userVoteId": null,
      "isHidden": true
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

**Example Request:**
```bash
# View another user's posts
curl http://localhost:3000/api/feed/author/uuid-123

# View your own posts (shows hidden posts)
curl http://localhost:3000/api/feed/author/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Error Responses:**
```json
// Author not found
{
  "error": "Author not found"
}
```

---

## Response Fields

### Post Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Post ID |
| `title` | string | Post title (max 60 chars) |
| `content` | string | Post content (80-220 words) |
| `createdAt` | string | ISO 8601 timestamp |
| `author` | object | Author details (id, username, learningScore) |
| `primaryTopic` | object | Topic details (id, name) |
| `voteCount` | integer | Number of upvotes |
| `commentCount` | integer | Number of comments |
| `hasVoted` | boolean | True if authenticated user has upvoted (requires auth) |
| `isSaved` | boolean | True if authenticated user has saved (requires auth) |
| `userVoteId` | integer\|null | Vote ID if user voted (for easy unvote) |
| `isHidden` | boolean | True if post is hidden by moderation |

### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| `limit` | integer | Posts per page requested |
| `offset` | integer | Number of posts skipped |
| `hasMore` | boolean | True if more posts available |

---

## Ordering Logic

All feeds use the same transparent ordering:

1. **Primary Sort:** `createdAt DESC`
   - Most recent posts appear first
   - Encourages fresh content

2. **Secondary Sort:** `voteCount DESC`
   - When posts are created at same time, higher voted posts appear first
   - Recognizes quality content

**No Hidden Complexity:**
- No time decay functions
- No user-specific personalization
- No AI-based ranking
- No engagement metrics beyond votes

This simple approach ensures:
- Transparency (users understand the order)
- Fairness (all posts get equal visibility initially)
- Quality signal (upvotes matter but don't dominate)

---

## Pagination

All feed endpoints support pagination:

```bash
# First page (20 posts)
GET /api/feed/home

# Second page
GET /api/feed/home?offset=20

# Custom page size
GET /api/feed/home?limit=50&offset=100
```

**Limits:**
- Default: 20 posts per request
- Maximum: 100 posts per request
- Minimum: 1 post per request

**hasMore Field:**
- `true`: More posts available (fetch next page)
- `false`: No more posts (reached end)

---

## Authentication Benefits

When authenticated, feeds include user-specific data:

**Without Authentication:**
```json
{
  "hasVoted": false,
  "isSaved": false,
  "userVoteId": null
}
```

**With Authentication:**
```json
{
  "hasVoted": true,
  "isSaved": true,
  "userVoteId": 456
}
```

**Benefits:**
- See which posts you've upvoted
- See which posts you've saved
- Quick access to unvote (using userVoteId)
- Still fully functional without auth (encourages exploration)

---

## Moderation Integration

Feeds respect moderation rules:

**Hidden Posts:**
- Users: Don't see hidden posts
- Admins: See all posts (including hidden)
- Authors: See their own hidden posts

**Soft-Deleted Posts:**
- Never shown in feeds
- Remain in database for audit

**Example (Author Feed):**
```javascript
// User viewing their own profile
GET /api/feed/author/uuid-123
Authorization: Bearer token-for-uuid-123
// Shows all posts including hidden ones

// Admin viewing someone's profile
GET /api/feed/author/uuid-123
Authorization: Bearer admin-token
// Shows all posts including hidden ones

// Regular user viewing someone's profile
GET /api/feed/author/uuid-123
Authorization: Bearer other-user-token
// Hidden posts excluded
```

---

## Error Handling

All feed endpoints return consistent errors:

**400 Bad Request:**
```json
{
  "error": "Invalid pagination parameters"
}
```

**404 Not Found:**
```json
{
  "error": "Topic not found"
}
// or
{
  "error": "Author not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch home feed"
}
```

---

## Use Cases

### 1. Browse Latest Posts
```bash
# Get most recent posts across all topics
curl http://localhost:3000/api/feed/home
```

### 2. Explore Topic
```bash
# See all React posts
curl http://localhost:3000/api/feed/topic/1
```

### 3. View User's Contributions
```bash
# See what a user has posted
curl http://localhost:3000/api/feed/author/uuid-123
```

### 4. Check Your Own Hidden Posts
```bash
# As the author, see posts that have been hidden
curl http://localhost:3000/api/feed/author/YOUR_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Infinite Scroll
```javascript
let offset = 0;
const limit = 20;

async function loadMore() {
  const response = await fetch(
    `http://localhost:3000/api/feed/home?limit=${limit}&offset=${offset}`
  );
  const data = await response.json();
  
  // Display posts
  displayPosts(data.posts);
  
  // Update offset for next page
  offset += limit;
  
  // Check if more posts available
  if (!data.pagination.hasMore) {
    hideLoadMoreButton();
  }
}
```

---

## Performance Considerations

**Query Optimization:**
- Indexes on `createdAt`, `primaryTopicId`, `authorId`
- Vote counts computed via Prisma's `_count`
- Pagination prevents large result sets

**N+1 Prevention:**
- Uses Prisma's `include` for relationships
- Batch queries for vote/save status
- Single query per page load

**Future Optimizations (Not Phase 9):**
- Redis caching for popular topics
- Materialized views for vote counts
- CDN for feed responses

---

## Testing

**Test Home Feed:**
```bash
curl http://localhost:3000/api/feed/home
```

**Test Topic Feed:**
```bash
curl http://localhost:3000/api/feed/topic/1
```

**Test Author Feed:**
```bash
curl http://localhost:3000/api/feed/author/uuid-123
```

**Test with Auth:**
```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.token')

# Use token
curl http://localhost:3000/api/feed/home \
  -H "Authorization: Bearer $TOKEN"
```

---

## Future Enhancements (Not Phase 9)

The following are explicitly NOT part of Phase 9:

❌ **Personalization:**
- User-specific feed ordering
- "For you" recommendations
- Collaborative filtering

❌ **Trending:**
- Trending posts algorithm
- Hot topics detection
- Velocity-based ranking

❌ **Time Decay:**
- Score degradation over time
- Age-weighted ranking
- Freshness boosting

❌ **Engagement Metrics:**
- Click-through tracking
- Time-on-post signals
- Scroll depth

❌ **AI/ML:**
- Content recommendations
- Similarity detection
- Topic modeling

The current implementation prioritizes:
- Simplicity over sophistication
- Transparency over optimization
- Fairness over engagement

---

## Summary

Phase 9 Feed API provides:

- ✅ Three feed views (home, topic, author)
- ✅ Simple, transparent ordering
- ✅ Optional authentication for enrichment
- ✅ Moderation-aware visibility
- ✅ Pagination support
- ✅ No AI or complex algorithms

All feeds are read-only, performant, and easy to understand. The ordering logic is explicit and unchanging, ensuring a fair and predictable experience for all users.
