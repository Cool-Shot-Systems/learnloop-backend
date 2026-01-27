/**
 * Comments Routes
 * 
 * CRUD endpoints for comments with authentication.
 * Phase 4: Comments only (no votes or reputation yet).
 */

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createComment,
  listCommentsForPost,
  getCommentById,
  updateComment,
  deleteComment
} from '../controllers/commentsController.js';

const router = express.Router();

/**
 * POST /api/comments
 * Create a new comment
 * Requires authentication
 * 
 * Body:
 * - content: string (min 20 characters)
 * - postId: number
 * 
 * Response:
 * - 201: Comment created
 * - 400: Validation error
 * - 404: Post not found
 */
router.post('/', requireAuth, createComment);

/**
 * GET /api/comments/:id
 * Get single comment by ID
 * 
 * Params:
 * - id: Comment ID (number)
 * 
 * Response:
 * - 200: Comment object
 * - 404: Comment not found
 */
router.get('/:id', getCommentById);

/**
 * PUT /api/comments/:id
 * Update comment
 * Requires authentication (author only)
 * 
 * Params:
 * - id: Comment ID (number)
 * 
 * Body:
 * - content: string (min 20 characters)
 * 
 * Response:
 * - 200: Updated comment
 * - 403: Not comment owner
 * - 404: Comment not found
 */
router.put('/:id', requireAuth, updateComment);

/**
 * DELETE /api/comments/:id
 * Delete comment (hard delete)
 * Requires authentication (author only)
 * 
 * Params:
 * - id: Comment ID (number)
 * 
 * Response:
 * - 200: Comment deleted
 * - 403: Not comment owner
 * - 404: Comment not found
 */
router.delete('/:id', requireAuth, deleteComment);

export default router;
