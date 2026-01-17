
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    imageUrl:{
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},
{timestamps: true}
)

export default mongoose.model("Chat", chatSchema);