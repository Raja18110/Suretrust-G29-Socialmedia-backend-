import cloudinary from "../utility/cloudinary.js";
import UserSchema from "../schemas/User.schema.js";
import friendRequestSchema from "../schemas/friendRequest.schema.js";
import { Post } from "../schemas/Post.schema.js";
import bcrypt from "bcryptjs";

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "profile_pics",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const updatedUser = await UserSchema.findByIdAndUpdate(
      req.user._id,
      { profilePic: result.secure_url },
      { new: true }
    );

    return res.status(200).json({
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

//export const getMyProfileData = async (req, res) => {
 // try {
  //  const userId = req.user._id;
 //   const user = await UserSchema.findById(userId).select("-password");

   // const totalFriends = await friendRequestSchema.countDocuments({
  //    $or: [{ from: userId }, { to: userId }],
  //    status: "accepted",
   // });

   // const pendingRequests = await friendRequestSchema.countDocuments({
   //   to: userId,
   //   status: "pending",
   // });
   // user.totalFriends = totalFriends;
    //user.pendingRequests = pendingRequests;
    //if (!user) {
    //  return res.status(404).json({ message: "User not found" });
   // }
   // res.status(200).json({
    //  success: true,
    //  user: req.user,
    //  counts: {
    //    friends: totalFriends,
    //    pendingRequests: pendingRequests,
    //  },
   // });
 // } catch (error) {
  //  console.error(error);
   // res.status(500).json({ message: error.message });
 // }
//};

export const getMyProfileData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await UserSchema.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const totalFriends = await friendRequestSchema.countDocuments({
      $or: [{ from: userId }, { to: userId }],
      status: "accepted",
    });

    const pendingRequests = await friendRequestSchema.countDocuments({
      to: userId,
      status: "pending",
    });

    const posts = await Post.find({
      user: userId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic")
      .lean();

    const postsWithLatestComments = posts.map(post => {
      const sortedComments = post.comments
        ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);

      return {
        ...post,
        comments: sortedComments,
      };
    });

    res.status(200).json({
      success: true,
      user,
      counts: {
        friends: totalFriends,
        pendingRequests,
      },
      posts: postsWithLatestComments,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


export const getUserWithPosts = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch user details
    const user = await UserSchema.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Count total friends
    const totalFriends = await friendRequestSchema.countDocuments({
      $or: [{ from: id }, { to: id }],
      status: "accepted",
    });

    // 3. Count pending requests (for that user)
    const pendingRequests = await friendRequestSchema.countDocuments({
      to: id,
      status: "pending",
    });

    // 4. Fetch latest 10 posts
    const posts = await Post.find({ user: id, isDeleted: false })
      .limit(10)
      .populate("user", "username email profilePic")
      .sort({ createdAt: -1 });

    // 5. Return response
    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        totalFriends,
        pendingRequests,
      },
      posts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both oldPassword and newPassword are required" });
    }

    const userId = req.user._id;
    const user = await UserSchema.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(newPassword, salt);
    user.password = hashed;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
 

export const updateUserDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, password } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password required to update details" });
    }

    const user = await UserSchema.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

     
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    if (email) {
      const existingUser = await UserSchema.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    let updateObj = {};
    if (name) updateObj.name = name;
    if (email) updateObj.email = email;

    const updatedUser = await UserSchema.findByIdAndUpdate(
      userId,
      updateObj,
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateUserDetails error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// New function to get user profile with friend status
export const getUserProfileWithFriendStatus = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const targetUserId = req.params.id;
    const user = await UserSchema.findById(targetUserId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const friendship = await friendRequestSchema.findOne({
      $or: [
        { from: loggedInUser, to: targetUserId, status: "accepted" },
        { from: targetUserId, to: loggedInUser, status: "accepted" }
      ]
    });
    const posts = await Post.find({ user: targetUserId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email profilePic");
    return res.status(200).json({
      success: true,
      user,
      is_friend: friendship ? true : false,
      posts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
