import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    from:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    to:{
         type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    post:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post",
    },
    type:{
        type:String,
        enum:[
            "like",
            "comment",
            "friend_request",
            "friend_request_accept"
        ],
        required:true
    },
    checked:{
        type:Boolean,
        default:false
    }
    
},{timestamps:true});

export const Notification=mongoose.model("Notification",notificationSchema);