import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectToDatabase from "./utility/dbConnect.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import friendRequestRouter from "./routes/friendRequest.route.js";
import notificationRouter from "./routes/notification.route.js";
import otpRouter from "./routes/otp.route.js";
import chatRouter from "./routes/chat.route.js";

import chatSchema from "./schemas/chat.schema.js";
import { isFriend } from "./utility/isFriend.js";
// import { JsonWebTokenError } from "jsonwebtoken";

const app = express();
const httpServer = http.createServer(app);

/* ---------- Socket.IO ---------- */
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("setup", (token) => {
    const decoded = jwt.verify(token, "prasanna");
    
        const userId = decoded.userId; // ✔ correct
    socket.join(userId);
    socket.userId = userId;
    console.log("User joined room:", userId);
  });

  socket.on("send_message", async ({ from, to, message, imageUrl }) => {
    try {
        const decoded = jwt.verify(from, "prasanna");
    
        const userId = decoded.userId; // ✔ correct
      const allowed = await isFriend(userId, to);
      if (!allowed) return;

      const chat = await chatSchema.create({
        from:userId,
        to,
        message,
        imageUrl,
      });

      const populatedChat = await chat.populate(
        "from to",
        "name profilePic"
      );
      console.log(populatedChat,'lololo');
      

      io.to(to).emit("receive_message", populatedChat);
      io.to(from).emit("receive_message", populatedChat);
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* ---------- Middlewares ---------- */
app.use(cors());
app.use(express.json());

/* ---------- Routes ---------- */
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/friendrequest", friendRequestRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/otp", otpRouter);
app.use("/api/chat", chatRouter);

/* ---------- DB ---------- */
connectToDatabase();

/* ---------- Server ---------- */
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default httpServer;