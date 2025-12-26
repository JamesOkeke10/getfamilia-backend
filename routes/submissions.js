const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");

router.post("/", async (req, res) => {
  try {
    const submission = await Submission.create(req.body);
    res.status(201).json({ success: true, submission });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
