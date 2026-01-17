import { Notification } from "../schemas/notification.schema.js";

export const getNotifications=async(req,res)=>{
  try {
    const userId=req.user._id;
    const notifications=await Notification.find({to:userId})
    .populate("from","name profilePic")
    .populate("post","_id text imageUrl")
    .sort({createdAt:-1});


    if(!notifications){
      return res.status(404).json({message:"No notifications found"});
    }
    res.status(200).json({notifications});
  } catch (error) {
    console.error(error);
    res.status(500).json({message:error.message});
  }
}

export const markNotificationAsRead=async(req,res)=>{
  try {
    const userId=req.user._id;
    const {notificationId}=req.params;
    const notification=await Notification.findOne({_id:notificationId,to:userId});

    if(!notification){
      return res.status(404).json({message:"Notification not found"});
    }   
    notification.checked=true;
    await notification.save();
    res.status(200).json({message:"Notification marked as read",notification});
  } catch (error) {
    console.error(error);
    res.status(500).json({message:error.message});
  }
}

export const markAllNotificationsAsRead=async(req,res)=>{
  try {
    const userId=req.user._id;  
    const result=await Notification.updateMany({to:userId,checked:false},{$set:{checked:true}});

    res.status(200).json({message:"All notifications marked as read",modifiedCount:result.modifiedCount});
  } catch (error) {
    console.error(error);
    res.status(500).json({message:error.message});
  }
}

export const getUnreadNotificationCount=async(req,res)=>{
  try {
    const userId=req.user._id;
    const count=await Notification.countDocuments({to:userId,checked:false});
    res.status(200).json({unreadCount:count});
  } catch (error) {
    console.error(error);
    res.status(500).json({message:error.message});
  }
}

// this api makes no sense at all
export const triggerLikeNotification=async(req,res)=>{
    try {
            const userId=req.user._id;
            const {postId,postOwnerId}=req.body;

            // if(userId.toString()===postOwnerId.toString()){
            //     return res.status(400).json({message:"You cannot like your own post"});
            // }
            // if(!postId || !postOwnerId){
            //     return res.status(400).json({message:"post not found"});
            // }
            const newNotification=await Notification.create({
                to:postOwnerId,
                from:userId,
                type:"like",
                post:postId
            });

            res.status(201).json({message:"Like notification created",notification:newNotification});


        
    } catch (error) {
        console.error(error);
        res.status(500).json({message:error.message});
    }

}
