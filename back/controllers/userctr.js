const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({
      email,
    });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    else{
    const user = new User({ name, email, password });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
   const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token=jwt.sign({email:user.email,userId:user._id},process.env.JWT_SECRET,{expiresIn:"24h"});
    res.status(200).json({ token ,name:user.name});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
