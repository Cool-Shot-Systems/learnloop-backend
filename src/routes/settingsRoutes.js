/**
 * Settings Routes
 * 
 * Minimal account settings endpoints for authenticated users.
 * Allows users to view and update their own profile information.
 */

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getCurrentUser, updateProfile } from '../controllers/settingsController.js';

const router = express.Router();

/**
 * GET /api/me
 * Get current authenticated user's profile
 * 
 * Requires authentication
 * 
 * Response:
 * - 200: User object with fields (id, username, bio, learningScore, createdAt)
 * - 404: User not found
 * 
 * Security:
 * - Auth required (JWT)
 * - Returns only safe fields (no email, password, or admin status)
 */
router.get('/', requireAuth, getCurrentUser);

/**
 * PUT /api/me
 * Update current user's profile
 * 
 * Requires authentication
 * 
 * Body (all optional):
 * - username: string (3-30 chars, alphanumeric + underscores)
 * - bio: string (max 160 chars) or null
 * 
 * Response:
 * - 200: Updated user object
 * - 400: Validation error or no fields to update
 * - 409: Username already taken
 * 
 * Security:
 * - Auth required (JWT)
 * - User can only update their own profile
 * - No email or password updates allowed
 * - Username uniqueness enforced
 */
router.put('/', requireAuth, updateProfile);

export default router;
