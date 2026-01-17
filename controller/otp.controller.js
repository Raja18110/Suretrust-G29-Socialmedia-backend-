import dotenv from "dotenv";
import { OTP } from "../schemas/otp.schema.js";
import nodemailer from "nodemailer";
import UserSchema from "../schemas/User.schema.js";
import bcrypt from "bcryptjs";
dotenv.config()
const salt = bcrypt.genSaltSync(10);

export const createOTP = async (req, res) => {
  try {
    console.log("Check");

    const { email } = req.body;
    console.log("Email received for OTP:", email);

    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // save OTP entry
    await OTP.create({
      email,
      otp: generatedOTP,
      createdAt: Date.now(),
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.mail_id,
        pass: process.env.mail_app_password, // Gmail App Password (correct)
      },
    });

    const info = await transporter.sendMail({
      from: "srenisivadas2004@gmail.com",
      to: email, // FIXED
      subject: "Your OTP Code",
      html: `<h2>Your OTP is: <b>${generatedOTP}</b></h2>`,
    });

    console.log("Message sent: %s", info.messageId);

    res.status(200).json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Error creating OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const changePasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpEntry = await OTP.findOne({ email, otp }).sort({ createdAt: -1 });
    if (!otpEntry) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
   if(otpEntry.is_expired=== true){
    return res.status(400).json({ message: "OTP has expired" });
   }
    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    await OTP.deleteMany({ email });

    res.status(200).json({ message: "Password changed successfully" });
  }
    catch (error) {
    console.error("Error changing password with OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  } 
};