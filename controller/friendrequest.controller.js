import friendRequestSchema from "../schemas/friendRequest.schema.js";
import { Notification } from "../schemas/notification.schema.js";

export const sendFriendRequest = async (req, res) => {
  try {
    // console.log(req, "kpkpkp");

    const sender = req.user._id;
    // console.log(sender,'sender');

    const { receiver } = req.body;
    // console.log(receiver);

    if (sender === receiver) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }
    const receiverUser = await friendRequestSchema.findOne({
      to: receiver,
      from: sender,
    });
    if (receiverUser) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    const receiverDetails = await friendRequestSchema.findById(receiver);
    console.log(receiverDetails);

    const friendRequest = await friendRequestSchema.create({
      from: sender,
      to: receiver,
      status: "pending",
    });

    // Create notification for the receiver
    await Notification.create({
      from: sender,
      to: receiver,
      type: "friend_request",
    });

    res
      .status(201)
      .json({ message: "Friend request sent successfully", friendRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get all friendRequests to me -> friendrequests which i received
//get friend requests from me-> friendrequests which i sent
export const getFriendRequests = async (req, res) => {
  try {
    const user = req.user._id;
    const friendRequests = await friendRequestSchema
      .find({ to: user })
      .populate("from", "name profilePic email")
      .populate("to", "name profilePic email");

    if (friendRequests.length === 0) {
      return res.status(200).json({ message: "No Friend Requests Found" });
    }
    res.status(200).json({ friendRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// accept or reject friend request

export const acceptOrRejectRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId, status } = req.body;

    const requestExist = await friendRequestSchema.findById(requestId);

    if (!requestExist) {
      return res.status(404).json({ message: "Request not found" });
    }

    // ---------------------
    // Validate authorization
    // ---------------------
    if (requestExist.to.toString() !== userId.toString()) {
      return res.status(400).json({
        message: "You are not authorized to accept or reject this request",
      });
    }

    // ---------------------
    // Update status
    // ---------------------
    requestExist.status = status;
    await requestExist.save(); // save FIRST

    // Create notification if accepted
    if (status === "accepted") {
      console.log("Creating notification for acceptance");
      await Notification.create({
        from: userId,
        to: requestExist.from,
        type: "friend_request_accept",
      });
      console.log("Notification created");
    }

    // ---------------------
    // Send response ONCE
    // ---------------------
    if (status === "accepted") {
      return res.status(200).json({
        message: "Friend request accepted successfully",
        request: requestExist,
      });
    } else {
      return res.status(200).json({
        message: "Friend request rejected successfully",
        request: requestExist,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "Unauthorized access" });
    }
    const friends = await friendRequestSchema
      .find({
        $or: [{ from: userId }, { to: userId }],
        status: "accepted"
      })
      .sort({ updatedAt: -1 })
      .limit(15)
      .populate("from", "name email profilePic")
      .populate("to", "name email profilePic");
    const friendsList = friends.map(fr => {
      if (fr.from._id.toString() === userId.toString()) {
        return fr.to;
      }
      return fr.from;
    }
    );
    if (friendsList.length === 0) {
      return res.status(200).json({ message: "No Friends Found" });
    }
    res.status(200).json({ friends: friendsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}
export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "Unauthorized access" });
    }
    const friends = await friendRequestSchema
      .find({
        $or: [{ from: userId }, { to: userId }],
        status: "accepted"
      })
      .sort({ updatedAt: -1 })
      .populate("from", "name email profilePic")
      .populate("to", "name email profilePic");
    const friendsList = friends.map(fr => {
      if (fr.from._id.toString() === userId.toString()) {
        return fr.to;
      }
      return fr.from;
    }
    );
    if (friendsList.length === 0) {
      return res.status(200).json({ message: "No Friends Found" });
    }
    res.status(200).json({ friends: friendsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}
// Get rejected friend requests
export const getRejectedFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = "all" } = req.query; // "all", "sent", "received"

    // Build query based on type
    let query = {
      $or: [
        { from: userId, status: "rejected" },
        { to: userId, status: "rejected" }
      ]
    };

    // If type is specified, filter accordingly
    if (type === "sent") {
      query = { from: userId, status: "rejected" };
    } else if (type === "received") {
      query = { to: userId, status: "rejected" };
    }

    const rejectedRequests = await friendRequestSchema
      .find(query)
      .populate("from", "name profilePic email")
      .populate("to", "name profilePic email")
      .sort({ updatedAt: -1 });

    // Format the response to include direction info
    const formattedRequests = rejectedRequests.map(request => {
      const isSender = request.from._id.toString() === userId.toString();

      return {
        ...request.toObject(),
        direction: isSender ? "sent" : "received",
        otherUser: isSender ? request.to : request.from
      };
    });

    if (formattedRequests.length === 0) {
      return res.status(200).json({ message: "No Rejected Requests Found" });
    }

    res.status(200).json({ rejectedRequests: formattedRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}