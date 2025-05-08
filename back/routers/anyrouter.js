const express = require("express");
const authMiddleware = require("../middlewares/next");

const router = express.Router();

router.get("/hi", authMiddleware, (req, res) => {
  res.status(200).json({ message: "hi" });
});

module.exports = router;
