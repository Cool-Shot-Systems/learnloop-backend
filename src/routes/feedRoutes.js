/**
 * Feed Routes
 * 
 * Read-only endpoints for discovering posts through different feeds.
 * Uses optional authentication to enrich responses with user-specific data.
 */

import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import {
  getHomeFeed,
  getTopicFeed,
  getAuthorFeed,
} from '../controllers/feedController.js';

const router = express.Router();

// All feed endpoints are read-only and use optional auth
// If authenticated: includes hasVoted and isSaved
// If not authenticated: still returns feed content

// Home feed - all posts ordered by recency and votes
router.get('/home', optionalAuth, getHomeFeed);

// Topic feed - posts filtered by topic
router.get('/topic/:topicId', optionalAuth, getTopicFeed);

// Author feed - posts by specific author
// Hidden posts visible only to author or admins
router.get('/author/:authorId', optionalAuth, getAuthorFeed);

export default router;
