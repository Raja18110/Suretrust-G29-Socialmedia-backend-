import {
    createPost,
    getMyPosts,
    likePost,
    upload,
    deletePost,
    restorePost,
    getDeletedPosts,
    addComment,
    getFeedPost,
    // New liked posts functions
    getPostsLikedByMe,
    getMyPostsLikedByOthers,
    unlikePost,
    getPostById,
    getPostStats
} from "../controller/post.controller.js";
import express from 'express'
import { authMiddleware } from "../utility/auth.Middleware.js";

const router = express.Router();

// Existing routes
router.post("/create", authMiddleware, upload("image"), createPost);
router.post("/like/:id", authMiddleware, likePost);
router.get("/myposts", authMiddleware, getMyPosts);
router.delete("/delete/:id", authMiddleware, deletePost);
router.put("/restore/:id", authMiddleware, restorePost);
router.get('/deletedposts', authMiddleware, getDeletedPosts);
router.post("/comment/:id", authMiddleware, addComment);
router.get("/feed", authMiddleware, getFeedPost);

// ============ NEW LIKED POSTS ROUTES ============

// Get posts liked by current user
router.get("/liked-by-me", authMiddleware, getPostsLikedByMe);

// Get current user's posts that are liked by others
router.get("/my-liked-posts", authMiddleware, getMyPostsLikedByOthers);

// Unlike a post
router.post("/unlike/:id", authMiddleware, unlikePost);

// Get post by ID
router.get("/:id", authMiddleware, getPostById);

// Get post statistics
router.get("/stats/overview", authMiddleware, getPostStats);

export default router;