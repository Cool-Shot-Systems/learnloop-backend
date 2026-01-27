/**
 * Feed Controller
 * 
 * Handles read-only feed endpoints with simple, transparent ordering logic.
 * No personalization, AI, or complex ranking algorithms.
 */

import prisma from '../../prisma.js';

/**
 * Get home feed - all posts ordered by recency and votes
 * GET /api/feed/home
 */
export const getHomeFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (isNaN(limit) || limit < 1 || isNaN(offset) || offset < 0) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin || false;

    // Get posts with vote counts
    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        // Non-admins don't see hidden posts
        ...(isAdmin ? {} : { isHidden: false }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true,
          },
        },
        primaryTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }, // Stable ordering
      ],
      skip: offset,
      take: limit,
    });

    // For each post, get vote count and check if user voted/saved
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const voteCount = post._count.votes;
        let hasVoted = false;
        let isSaved = false;
        let userVoteId = null;

        if (userId) {
          // Check if user voted
          const vote = await prisma.vote.findFirst({
            where: {
              userId,
              postId: post.id,
            },
            select: { id: true },
          });
          if (vote) {
            hasVoted = true;
            userVoteId = vote.id;
          }

          // Check if user saved
          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: {
                userId,
                postId: post.id,
              },
            },
          });
          isSaved = !!saved;
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          author: post.author,
          primaryTopic: post.primaryTopic,
          voteCount,
          commentCount: post._count.comments,
          hasVoted,
          isSaved,
          userVoteId,
          isHidden: post.isHidden,
        };
      })
    );

    // Sort by vote count as secondary sort (client-side for now)
    enrichedPosts.sort((a, b) => {
      // Primary: createdAt desc
      const timeCompare = new Date(b.createdAt) - new Date(a.createdAt);
      if (timeCompare !== 0) return timeCompare;
      
      // Secondary: voteCount desc
      return b.voteCount - a.voteCount;
    });

    res.json({
      posts: enrichedPosts,
      pagination: {
        limit,
        offset,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get home feed error:', error);
    res.status(500).json({ error: 'Failed to fetch home feed' });
  }
};

/**
 * Get topic feed - posts filtered by topic
 * GET /api/feed/topic/:topicId
 */
export const getTopicFeed = async (req, res) => {
  try {
    const topicId = parseInt(req.params.topicId);
    if (isNaN(topicId)) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (isNaN(limit) || limit < 1 || isNaN(offset) || offset < 0) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin || false;

    // Get posts for this topic
    const posts = await prisma.post.findMany({
      where: {
        primaryTopicId: topicId,
        deletedAt: null,
        ...(isAdmin ? {} : { isHidden: false }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true,
          },
        },
        primaryTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    // Enrich posts with vote/save status
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const voteCount = post._count.votes;
        let hasVoted = false;
        let isSaved = false;
        let userVoteId = null;

        if (userId) {
          const vote = await prisma.vote.findFirst({
            where: { userId, postId: post.id },
            select: { id: true },
          });
          if (vote) {
            hasVoted = true;
            userVoteId = vote.id;
          }

          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: { userId, postId: post.id },
            },
          });
          isSaved = !!saved;
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          author: post.author,
          primaryTopic: post.primaryTopic,
          voteCount,
          commentCount: post._count.comments,
          hasVoted,
          isSaved,
          userVoteId,
          isHidden: post.isHidden,
        };
      })
    );

    // Sort by vote count as secondary
    enrichedPosts.sort((a, b) => {
      const timeCompare = new Date(b.createdAt) - new Date(a.createdAt);
      if (timeCompare !== 0) return timeCompare;
      return b.voteCount - a.voteCount;
    });

    res.json({
      topic,
      posts: enrichedPosts,
      pagination: {
        limit,
        offset,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get topic feed error:', error);
    res.status(500).json({ error: 'Failed to fetch topic feed' });
  }
};

/**
 * Get author feed - posts by specific author
 * Hidden posts visible only to author themselves or admins
 * GET /api/feed/author/:authorId
 */
export const getAuthorFeed = async (req, res) => {
  try {
    const authorId = req.params.authorId;
    
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (isNaN(limit) || limit < 1 || isNaN(offset) || offset < 0) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    // Verify author exists
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        username: true,
        learningScore: true,
      },
    });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin || false;
    const isOwnProfile = userId === authorId;

    // Determine visibility
    // Show hidden posts ONLY if viewing own profile or is admin
    const showHidden = isOwnProfile || isAdmin;

    // Get posts by this author
    const posts = await prisma.post.findMany({
      where: {
        authorId,
        deletedAt: null,
        ...(showHidden ? {} : { isHidden: false }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true,
          },
        },
        primaryTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    // Enrich posts
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const voteCount = post._count.votes;
        let hasVoted = false;
        let isSaved = false;
        let userVoteId = null;

        if (userId) {
          const vote = await prisma.vote.findFirst({
            where: { userId, postId: post.id },
            select: { id: true },
          });
          if (vote) {
            hasVoted = true;
            userVoteId = vote.id;
          }

          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: { userId, postId: post.id },
            },
          });
          isSaved = !!saved;
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          author: post.author,
          primaryTopic: post.primaryTopic,
          voteCount,
          commentCount: post._count.comments,
          hasVoted,
          isSaved,
          userVoteId,
          isHidden: post.isHidden,
        };
      })
    );

    // Sort by vote count as secondary
    enrichedPosts.sort((a, b) => {
      const timeCompare = new Date(b.createdAt) - new Date(a.createdAt);
      if (timeCompare !== 0) return timeCompare;
      return b.voteCount - a.voteCount;
    });

    res.json({
      author,
      posts: enrichedPosts,
      pagination: {
        limit,
        offset,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get author feed error:', error);
    res.status(500).json({ error: 'Failed to fetch author feed' });
  }
};
