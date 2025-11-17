// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------
// Environment Variables
// ----------------------
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN; 
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

console.log("🚀 Starting server...");
console.log("CLIENT_ORIGIN =", CLIENT_ORIGIN || "❌ NOT SET");
console.log("GOOGLE_MAPS_KEY =", GOOGLE_MAPS_KEY ? "✔ SET" : "❌ NOT SET");

// ----------------------
// Middleware
// ----------------------
app.use(express.json());

// ----------------------
// FIXED & ROBUST CORS
// ----------------------
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🌍 Incoming request from:", origin);

      // Allow your Render frontend
      if (CLIENT_ORIGIN && origin === CLIENT_ORIGIN) {
        console.log("✅ CORS allowed:", origin);
        return callback(null, true);
      }

      // Allow requests without origin (mobile apps, curl, Postman)
      if (!origin) {
        console.log("⚠️ No origin (mobile/Postman) → allowed");
        return callback(null, true);
      }

      // TEMPORARY: allow all (prevents blocking while debugging)
      console.log("⚠️ Allowing all origins temporarily:", origin);
      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// Allow OPTIONS preflight requests
app.options("*", cors());

// ----------------------
// Health Check
// ----------------------
app.get("/", (req, res) => {
  res.json({
    message: "MM Courier Route Planner API is running 🚀",
    status: "OK",
    frontend: CLIENT_ORIGIN,
  });
});

// ----------------------
// POST /optimize
// ----------------------
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;

    if (!stops || stops.length < 2) {
      return res.status(400).json({ error: "At least two stops required." });
    }

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;

    const waypoints =
      stops.length > 2
        ? stops.slice(1, -1).map((s) => `${s.lat},${s.lon}`).join("|")
        : "";

    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin}&destination=${destination}` +
      `&waypoints=optimize:true|${waypoints}` +
      `&key=${GOOGLE_MAPS_KEY}`;

    console.log("➡ Fetching Google Directions API...");
    console.log(url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("❌ Google API Error:", data);
      return res.status(500).json({
        error: "Google Directions API failed",
        details: data,
      });
    }

    console.log("✅ Route optimized successfully");
    res.json(data);
  } catch (err) {
    console.error("❌ Route optimization failed:", err);
    res.status(500).json({
      error: "Route optimization failed",
      details: err.message,
    });
  }
});

// ----------------------
// Start Server
// ----------------------
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
