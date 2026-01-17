import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  image: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  isDeleted: { type: Boolean, default: false },   
  deletedAt: { type: Date, default: null },       
}, { timestamps: true });

export const Post = mongoose.model('Post', postSchema);