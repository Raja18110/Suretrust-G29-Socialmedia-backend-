import chatSchema from "../schemas/chat.schema.js";
import { isFriend } from "../utility/isFriend.js";

export const sendMessage = async (req, res) => {
    try {
        const from = req.user._id;
        const {to,message,imageUrl} = req.body;
        if (!to || !message) return res.status(400).json({ message: "Both to and message are required" })
        const allowed=await isFriend(from,to);
        if(!allowed) return res.status(403).json({message:"You are not allowed to send message to this user"});
        const chat = await chatSchema.create({ from, to, message,imageUrl });

        const populateChat = await chat.populate("from to","name profilePic");
        res.status(201).json({ populateChat });
        }
        catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

export const getConverstations = async(req,res)=>{
    try {
        const userId = req.user._id;

        const {friendId}=req.params;

        const allowed=await isFriend(userId,friendId);
        if(!allowed) return res.status(403).json({message:"You are not allowed to send message to this user"}); 

        const conversations = await chatSchema.find({$or:[{from:userId,to:friendId},{from:friendId,to:userId}]}).populate("from to","name profilePic").sort({createdAt:-1});
        res.status(200).json({conversations});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

