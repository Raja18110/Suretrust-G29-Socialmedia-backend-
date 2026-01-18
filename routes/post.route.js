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
router.get("/liked-by-me", authMiddleware, getPostsLikedByMe);
router.get("/my-liked-posts", authMiddleware, getMyPostsLikedByOthers);
router.post("/unlike/:id", authMiddleware, unlikePost);
router.get("/stats/overview", authMiddleware, getPostStats);
router.get("/:id", authMiddleware, getPostById); // Keep this LAST to avoid route conflicts

export default router;