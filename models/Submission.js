const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    inquiryType: {
      type: String,
      enum: [
        "Artist Submission",
        "Booking",
        "Collaboration",
        "Media",
        "Other",
      ],
      required: true,
    },
    links: {
      type: String,
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

module.exports = mongoose.model("Submission", submissionSchema);
