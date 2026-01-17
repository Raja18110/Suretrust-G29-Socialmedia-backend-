import friendRequestSchema from "../schemas/friendRequest.schema.js";

export const isFriend = async (sender, receiver) => {
  const friendShip = await friendRequestSchema.findOne({
    $or: [
      { from: sender, to: receiver ,status:"accepted"},
      { from: receiver, to: sender,status:"accepted" },
    ],
  });
  return friendShip ? true : false;
};
