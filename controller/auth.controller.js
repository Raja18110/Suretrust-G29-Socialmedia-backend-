import user from "../schemas/User.schema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const salt = bcrypt.genSaltSync(10);

export const register = async (req, res) => {
  try {
    console.log("====================================");
    console.log(req.body);
    console.log("====================================");
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const userExist = await user.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "user already exist" });
    }

    const hashedPassword = bcrypt.hashSync(password, salt);

    const userCreated = await user.create({ email, password:hashedPassword, name });
    if (!userCreated) {
      return res.status(400).json({ message: "user not created" });
    }

    res.status(201).json({ message: "user created successfully" });
  } catch (error) {
    console.error(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const userExist = await user.findOne({ email });

    const isPasswordValid = userExist
      ? bcrypt.compareSync(password, userExist.password)
      : false;
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!userExist) {
      return res.status(400).json({ message: "user not exist" });
    }
    console.log(userExist._id);

    const token = jwt.sign(
      { userId: userExist._id, email: user.email },
      "prasanna",
      { expiresIn: "7d" }
    );

    res
      .status(200)
      .json({profilePic:userExist.profilePic, token, message: `${userExist.name} logged in successfully` });
  } catch (error) {
    console.error(error);
  }
};

export const searchUser = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Please provide a name" });
    }

    // Case-insensitive partial search
    const users = await user.find({
      name: { $regex: name, $options: "i" }
    }).select("name email profilePic");

    if (users.length === 0) {
      return res.status(200).json({ message: "No user found", users: [] });
    }

    res.status(200).json({ users });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
