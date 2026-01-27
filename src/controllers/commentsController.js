/**
 * Comments Controller
 * 
 * CRUD operations for comments with validation.
 * Phase 4: Comments only (no votes or reputation yet).
 */

import prisma from '../../prisma.js';
import { isOwner } from '../middleware/authMiddleware.js';

// Constants
const MIN_CONTENT_LENGTH = 20;

/**
 * Create a new comment
 * 
 * POST /api/comments
 * Requires authentication
 * 
 * Body:
 * - content: string (min 20 characters)
 * - postId: number
 */
export async function createComment(req, res) {
  try {
    const { content, postId } = req.body;
    const authorId = req.user.id;

    // Validate content
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
      return res.status(400).json({
        error: `Comment must be at least ${MIN_CONTENT_LENGTH} characters long (currently ${trimmedContent.length} characters)`
      });
    }

    // Validate postId
    if (!postId) {
      return res.status(400).json({
        error: 'Post ID is required'
      });
    }

    const parsedPostId = parseInt(postId, 10);
    if (isNaN(parsedPostId)) {
      return res.status(400).json({
        error: 'Invalid post ID format'
      });
    }

    // Check if post exists and is not deleted
    const post = await prisma.post.findFirst({
      where: {
        id: parsedPostId,
        deletedAt: null
      }
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: trimmedContent,
        authorId,
        postId: parsedPostId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Comment created successfully',
      comment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({
      error: 'Internal server error while creating comment'
    });
  }
}

/**
 * List comments for a post
 * 
 * GET /api/posts/:postId/comments
 * 
 * Query params:
 * - limit: number of comments (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 */
export async function listCommentsForPost(req, res) {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const parsedPostId = parseInt(postId, 10);
    if (isNaN(parsedPostId)) {
      return res.status(400).json({
        error: 'Invalid post ID format'
      });
    }

    // Parse and validate pagination
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    // Check if post exists and is not deleted
    const post = await prisma.post.findFirst({
      where: {
        id: parsedPostId,
        deletedAt: null
      }
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    // Fetch comments and total count
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId: parsedPostId
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              learningScore: true
            }
          },
          _count: {
            select: {
              votes: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc' // Oldest first
        },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.comment.count({
        where: {
          postId: parsedPostId
        }
      })
    ]);

    return res.status(200).json({
      comments,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount
      }
    });

  } catch (error) {
    console.error('List comments error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching comments'
    });
  }
}

/**
 * Get single comment by ID
 * 
 * GET /api/comments/:id
 */
export async function getCommentById(req, res) {
  try {
    const { id } = req.params;

    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({
        error: 'Invalid comment ID format'
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true,
            createdAt: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            authorId: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found'
      });
    }

    return res.status(200).json({ comment });

  } catch (error) {
    console.error('Get comment by ID error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching comment'
    });
  }
}

/**
 * Update comment
 * 
 * PUT /api/comments/:id
 * Requires authentication (author only)
 * 
 * Body:
 * - content: string (min 20 characters)
 */
export async function updateComment(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({
        error: 'Invalid comment ID format'
      });
    }

    // Validate content
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
      return res.status(400).json({
        error: `Comment must be at least ${MIN_CONTENT_LENGTH} characters long (currently ${trimmedContent.length} characters)`
      });
    }

    // Fetch comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found'
      });
    }

    // Check ownership
    if (!isOwner(userId, comment.authorId)) {
      return res.status(403).json({
        error: 'You can only update your own comments'
      });
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: trimmedContent
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });

  } catch (error) {
    console.error('Update comment error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating comment'
    });
  }
}

/**
 * Delete comment
 * 
 * DELETE /api/comments/:id
 * Requires authentication (author only)
 * 
 * Hard delete (removes from database).
 */
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({
        error: 'Invalid comment ID format'
      });
    }

    // Fetch comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found'
      });
    }

    // Check ownership
    if (!isOwner(userId, comment.authorId)) {
      return res.status(403).json({
        error: 'You can only delete your own comments'
      });
    }

    // Hard delete comment
    await prisma.comment.delete({
      where: { id: commentId }
    });

    return res.status(200).json({
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({
      error: 'Internal server error while deleting comment'
    });
  }
}
