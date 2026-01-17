import express from "express"
import { sendMessage,getConverstations } from "../controller/chat.controller.js";
import { authMiddleware } from "../utility/auth.Middleware.js";

const router = express.Router();

router.post("/send", authMiddleware, sendMessage);
router.get("/conversations/:friendId", authMiddleware, getConverstations);
export default router