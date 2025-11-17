// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------
// Required ENV
// ----------------------------
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

// Safety logs
console.log("CLIENT_ORIGIN =", CLIENT_ORIGIN);
console.log("GOOGLE_MAPS_KEY =", GOOGLE_MAPS_KEY ? "Loaded" : "Missing");

// ----------------------------
// CORS (FULL + PRE-FLIGHT SAFE)
// ----------------------------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", CLIENT_ORIGIN);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Also apply express.json()
app.use(express.json());

// ----------------------------
// Debug endpoint to test CORS
// ----------------------------
app.get("/cors-test", (req, res) => {
  res.json({
    message: "CORS is working",
    origin_received: req.headers.origin,
    allowed_origin: CLIENT_ORIGIN
  });
});

// ----------------------------
// Health route
// ----------------------------
app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

// ----------------------------
// Route Optimization
// ----------------------------
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;

    if (!stops || stops.length < 2) {
      return res.status(400).json({ error: "At least two stops required" });
    }

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;

    const waypoints =
      stops.length > 2
        ? "optimize:true|" +
          stops.slice(1, -1).map(s => `${s.lat},${s.lon}`).join("|")
        : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&key=${GOOGLE_MAPS_KEY}`;

    console.log("Requesting Google:", url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google API error:", data);
      return res.status(500).json({ error: "Google API failed", details: data });
    }

    res.json(data);
  } catch (error) {
    console.error("Error optimizing:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
