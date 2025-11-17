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

// Preflight handler for OPTIONS requests
app.options("*", cors());

// ----------------------
// Health check
// ----------------------
app.get("/", (req, res) => res.json({ message: "Route Planner API running 🚀" }));

// ----------------------
// POST /geocode
// ----------------------
app.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return res.status(400).json({ error: "Geocoding failed", details: data });

    res.json(data.results[0].geometry.location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Geocoding error" });
  }
});

// ----------------------
// POST /optimize
// ----------------------
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;
    if (!stops || stops.length < 2) return res.status(400).json({ error: "At least two stops required" });

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length-1].lat},${stops[stops.length-1].lon}`;
    const waypoints = stops.length > 2 ? stops.slice(1, -1).map(s => `${s.lat},${s.lon}`).join("|") : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return res.status(500).json({ error: "Directions API failed", details: data });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Route optimization error" });
  }
});

// ----------------------
// POST /mark-delivered
// ----------------------
// This will just log delivered stops in memory for now
let deliveredStops = []; // reset when server restarts
app.post("/mark-delivered", (req, res) => {
  try {
    const { stopId } = req.body;
    if (stopId === undefined) return res.status(400).json({ error: "stopId required" });

    deliveredStops.push(stopId);
    console.log(`Stop ${stopId} marked delivered. Delivered stops:`, deliveredStops);

    res.json({ message: `Stop ${stopId} marked delivered`, deliveredStops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark stop delivered" });
  }
});

// ----------------------
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
