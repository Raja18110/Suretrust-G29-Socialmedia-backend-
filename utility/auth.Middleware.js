import jwt from "jsonwebtoken";
import UserSchema from "../schemas/User.schema.js";


export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "prasanna");

    const userId = decoded.userId; // ✔ correct
    const user = await UserSchema.findById(userId).select("-password"); // remove password

    if (!user)
      return res.status(404).json({ message: "User not found" });

    req.user = user;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
