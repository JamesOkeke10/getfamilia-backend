const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Submission = require("../models/Submission");
const { sendSubmissionEmails } = require("../utils/email");

// POST /api/submissions
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 80 })
      .withMessage("Name must be 2–80 characters"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email must be valid")
      .normalizeEmail(),

    body("inquiryType")
      .trim()
      .notEmpty()
      .withMessage("Inquiry type is required")
      .isIn(["Artist Submission", "Booking", "Collaboration", "Media", "Other"])
      .withMessage("Invalid inquiry type"),

    body("links")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 300 })
      .withMessage("Links field is too long"),

    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Message must be 10–2000 characters"),
  ],
  async (req, res) => {
    // 1) Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, email, inquiryType, links, message } = req.body;

    try {
      // 2) Save to MongoDB FIRST (always)
      const submission = await Submission.create({
        name,
        email,
        inquiryType,
        links: links || "",
        message,
      });

      // 3) Emails (admin + auto-reply)
      // If email fails, we still return success but indicate it in the response
      let emailSent = false;
      let emailError = null;

      try {
        await sendSubmissionEmails({ name, email, inquiryType, links, message });
        emailSent = true;
      } catch (err) {
        emailSent = false;
        emailError = err?.message || String(err);
        console.error("Email sending failed:", err);
      }

      return res.status(201).json({
        success: true,
        message: emailSent
          ? "Submission received successfully."
          : "Submission saved, but email could not be sent (check server logs).",
        submissionId: submission._id,
        emailSent,
        emailError, // remove later if you don’t want to expose it
      });
    } catch (err) {
      console.error("Submission error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;
