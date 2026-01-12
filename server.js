require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const app = express();

/**
 * Trust proxy is REQUIRED on Render (and most cloud hosts)
 * so req.ip + rate limiting works correctly behind their proxy.
 */
app.set("trust proxy", 1);

/**
 * Security headers
 */
app.use(
  helmet({
    // Keep this false unless you deliberately want to enable strict CSP.
    // CSP can break embedded YouTube/FontAwesome/CDN assets if misconfigured.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/**
 * Rate limiting (applies to all /api routes)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api", apiLimiter);

/**
 * CORS
 * IMPORTANT: replace placeholders with your real Netlify site if you still use it.
 * If you only use getfamilia.ca, you can remove the netlify domain.
 */
const allowedOrigins = [
  "https://getfamilia.ca",
  "https://www.getfamilia.ca",

];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * Body parsing
 */
app.use(express.json({ limit: "10kb" }));

/**
 * Connect DB
 */
connectDB();

/**
 * Routes
 */
app.use("/api/submissions", require("./routes/submissions"));

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.status(200).send("Get Familia API running");
});

/**
 * 404 handler (API)
 */
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // CORS errors land here (because we throw in the CORS callback)
  if (String(err?.message || "").toLowerCase().includes("cors blocked")) {
    return res.status(403).json({ error: "CORS error: origin not allowed" });
  }

  res.status(500).json({ error: "Server error. Please try again." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
