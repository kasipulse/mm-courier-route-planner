// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------
// Environment variables
// ----------------------
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN; // e.g., "https://mm-courier-route-planner-ui.onrender.com"
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

if (!CLIENT_ORIGIN || !GOOGLE_MAPS_KEY) {
  console.error("Error: CLIENT_ORIGIN or GOOGLE_MAPS_KEY not set in .env!");
  process.exit(1);
}

// ----------------------
// Middleware
// ----------------------
app.use(express.json());

// CORS setup
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Handle OPTIONS preflight requests
app.options("*", cors());

// ----------------------
// Health check
// ----------------------
app.get("/", (req, res) => {
  res.json({ message: "Route Planner API running 🚀" });
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
        ? stops.slice(1, -1).map(s => `${s.lat},${s.lon}`).join("|")
        : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_MAPS_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Directions API error:", data);
      return res.status(500).json({
        error: "Google Directions API failed",
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Route optimization failed:", err);
    res.status(500).json({
      error: "Route optimization failed",
      details: err.message,
    });
  }
});

// ----------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
