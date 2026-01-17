import { Post } from "../schemas/Post.schema.js";
import cloudinary from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import { Notification } from "../schemas/notification.schema.js";
import friendRequestSchema from "../schemas/friendRequest.schema.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
}

const storage = multer.memoryStorage();
export const upload = (fieldName) =>
  multer({ storage: storage }).single(fieldName);

export const createPost = async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
      console.log("Uploaded file no file uploaded:", imageUrl);
    }

    const user = req.user._id;
    const { text } = req.body;
    // handleUpload(req.file);
    console.log(text)
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const post = await Post.create({
      user,
      text,
      image: imageUrl
    });

    return res.status(201).json({
      message: "Post created successfully",
      post
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    // console.log(userId,id);

    const post = await Post.findById(id);
    if (!post) {
      return res.status(400).json({ message: "post not found" });
    }
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "You have already liked this post" });
    }
    post.likes.push(userId);
    await post.save();
    const newNotification = await Notification.create({
      to: post.user,
      from: userId,
      type: "like",
      post: post._id
    });

    res.status(200).json({ message: "post liked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({ user: userId, isDeleted: false })
      .limit(5)
      .populate(
        "user",
        "username email profilePic"
      ).sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export const getDeletedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Find deleted posts for the current user
    const deletedPosts = await Post.find({
      user: userId,
      isDeleted: true
    })
      .skip(skip)
      .limit(limitNumber)
      .populate(
        "user",
        "username email profilePic"
      )
      .sort({ deletedAt: -1, createdAt: -1 });

    // Get total count for pagination
    const totalDeletedPosts = await Post.countDocuments({
      user: userId,
      isDeleted: true
    });

    return res.status(200).json({
      message: "Deleted posts fetched successfully",
      posts: deletedPosts,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalDeletedPosts / limitNumber),
        totalItems: totalDeletedPosts,
        itemsPerPage: limitNumber
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    console.log(id, userId);

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not allowed to delete this post" });
    }
    if (post.isDeleted) {
      return res.status(404).json({ message: "Post is already deleted" });
    }
    if (post.image) {
      const publicId = post.image
        .split("/")
        .pop()
        .split(".")[0];

      try {
        await cloudinary.v2.uploader.destroy(publicId);
      } catch (err) {
        console.log("Cloudinary delete failed (not critical)", err.message);
      }
    }
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    return res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//add comment to post 
export const addComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    // create comment
    const commentObj = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(commentObj);
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    if (post.user.toString() !== userId.toString()) {
      await Notification.create({
        to: post.user,
        from: userId,
        type: "comment",
        post: post._id
      });
    }

    return res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
      commentCount: post.comments.length
    });

  } catch (error) {
    console.error("addComment error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//add comment to post 

export const restorePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Only the owner can restore
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not allowed to restore this post" });
    }

    if (!post.isDeleted) {
      return res.status(400).json({ message: "Post is not deleted" });
    }

    post.isDeleted = false;
    post.deletedAt = null;

    await post.save();

    return res.status(200).json({ message: "Post restored successfully", post });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getFeedPost = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const skip = (page - 1) * limit;

    /* ------------------------------------
       STEP 1: Get direct friends
    ------------------------------------ */
    const friends = await friendRequestSchema.find({
      $or: [{ from: userId }, { to: userId }],
      status: "accepted"
    }).select("from to");

    const directFriendIds = friends.map(f =>
      f.from.toString() === userId.toString()
        ? f.to.toString()
        : f.from.toString()
    );

    /* ------------------------------------
       STEP 2: Get mutual friends
       (friends of my friends)
    ------------------------------------ */
    const mutualRequests = await friendRequestSchema.find({
      $or: [
        { from: { $in: directFriendIds } },
        { to: { $in: directFriendIds } }
      ],
      status: "accepted"
    }).select("from to");

    const mutualFriendIds = new Set();

    mutualRequests.forEach(f => {
      const from = f.from.toString();
      const to = f.to.toString();

      if (from !== userId.toString() && !directFriendIds.includes(from)) {
        mutualFriendIds.add(from);
      }
      if (to !== userId.toString() && !directFriendIds.includes(to)) {
        mutualFriendIds.add(to);
      }
    });

    /* ------------------------------------
       STEP 3: Final feed user IDs
    ------------------------------------ */
    const feedUserIds = [
      ...new Set([...directFriendIds, ...mutualFriendIds])
    ];

    /* ------------------------------------
       STEP 4: Fetch feed posts (ONE QUERY)
    ------------------------------------ */
    const posts = await Post.find({
      user: { $in: feedUserIds },
      isDeleted: false
    })
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    /* ------------------------------------
       STEP 5: Response
    ------------------------------------ */
    return res.status(200).json({
      message: "Feed posts fetched successfully",
      page,
      limit,
      count: posts.length,
      posts
    });

  } catch (error) {
    console.error("Feed Error:", error);
    res.status(500).json({ message: "Failed to fetch feed posts" });
  }
};

// ============ ADDED LIKED POSTS FUNCTIONS ============

// ============ GET POSTS LIKED BY CURRENT USER ============
export const getPostsLikedByMe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Find posts that the current user has liked
    const likedPosts = await Post.find({
      likes: { $in: [userId] },
      isDeleted: false
    })
      .skip(skip)
      .limit(limitNumber)
      .populate("user", "username profilePic")
      .populate({
        path: 'likes',
        select: 'username profilePic',
        options: { limit: 5 }
      })
      .sort({ createdAt: -1 });

    // Get total count
    const totalLikedPosts = await Post.countDocuments({
      likes: { $in: [userId] },
      isDeleted: false
    });

    return res.status(200).json({
      message: "Posts liked by you fetched successfully",
      posts: likedPosts,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalLikedPosts / limitNumber),
        totalItems: totalLikedPosts,
        itemsPerPage: limitNumber
      }
    });

  } catch (error) {
    console.error("Error fetching posts liked by user:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ============ GET POSTS OF CURRENT USER THAT ARE LIKED BY OTHERS ============
export const getMyPostsLikedByOthers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Find user's posts that have been liked by others
    const myLikedPosts = await Post.find({
      user: userId,
      isDeleted: false,
      likes: { $exists: true, $ne: [] }
    })
      .skip(skip)
      .limit(limitNumber)
      .populate("user", "username profilePic")
      .populate({
        path: 'likes',
        select: 'username profilePic',
        options: { limit: 10 }
      })
      .sort({ createdAt: -1 });

    // Get total count
    const totalMyLikedPosts = await Post.countDocuments({
      user: userId,
      isDeleted: false,
      likes: { $exists: true, $ne: [] }
    });

    return res.status(200).json({
      message: "Your posts liked by others fetched successfully",
      posts: myLikedPosts,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalMyLikedPosts / limitNumber),
        totalItems: totalMyLikedPosts,
        itemsPerPage: limitNumber
      }
    });

  } catch (error) {
    console.error("Error fetching user posts liked by others:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ============ UNLIKE POST ============
export const unlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user has liked the post
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ message: "You have not liked this post" });
    }

    // Remove user from likes array
    post.likes = post.likes.filter(
      likeId => likeId.toString() !== userId.toString()
    );

    await post.save();

    return res.status(200).json({
      message: "Post unliked successfully",
      likesCount: post.likes.length
    });

  } catch (error) {
    console.error("Error unliking post:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ============ GET POST BY ID ============
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('user', 'username profilePic')
      .populate({
        path: 'likes',
        select: 'username profilePic'
      })
      .populate({
        path: 'comments.user',
        select: 'username profilePic'
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user liked this post
    const hasUserLiked = post.likes.some(
      like => like._id.toString() === userId.toString()
    );

    return res.status(200).json({
      message: "Post fetched successfully",
      post: {
        ...post.toObject(),
        hasUserLiked,
        likesCount: post.likes.length,
        commentsCount: post.comments.length
      }
    });

  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ============ GET POST STATISTICS ============
export const getPostStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get statistics in parallel
    const [
      totalPosts,
      deletedPosts,
      activePosts,
      totalLikes
    ] = await Promise.all([
      // Total posts
      Post.countDocuments({ user: userId }),

      // Deleted posts
      Post.countDocuments({ user: userId, isDeleted: true }),

      // Active posts
      Post.countDocuments({ user: userId, isDeleted: false }),

      // Total likes on user's posts
      Post.aggregate([
        { $match: { user: userId, isDeleted: false } },
        { $project: { likesCount: { $size: "$likes" } } },
        { $group: { _id: null, total: { $sum: "$likesCount" } } }
      ])
    ]);

    return res.status(200).json({
      message: "Post statistics fetched successfully",
      stats: {
        totalPosts,
        deletedPosts,
        activePosts,
        totalLikes: totalLikes[0]?.total || 0,
        deletedPercentage: totalPosts > 0 ? ((deletedPosts / totalPosts) * 100).toFixed(1) : 0,
        avgLikesPerPost: activePosts > 0 ? ((totalLikes[0]?.total || 0) / activePosts).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error("Error fetching post statistics:", error);
    return res.status(500).json({ message: error.message });
  }
};