import { changePasswordWithOTP, createOTP } from "../controller/otp.controller.js";
import express from 'express'

const router = express.Router();


router.post('/otp',createOTP)
router.post('/verify-otp',changePasswordWithOTP)
export default router;

