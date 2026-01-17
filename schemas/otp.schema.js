import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  is_used: {
    type: Boolean,
    default: false,
    required: true
  },
  is_expired: {
    type: Boolean,
    default: false,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800 
  }
});

// TTL index will delete the document after 30 minutes
export const OTP = mongoose.model("OTP", otpSchema);