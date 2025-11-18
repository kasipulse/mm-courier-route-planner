import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN; // set WITHOUT trailing slash
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

if (!CLIENT_ORIGIN || !GOOGLE_MAPS_KEY) {
  console.error("Error: CLIENT_ORIGIN or GOOGLE_MAPS_KEY not set in .env!");
  process.exit(1);
}

app.use(express.json());

// CORS: allow only your UI origin (safe)
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (origin === CLIENT_ORIGIN) return callback(null, true);
    console.log("CORS BLOCKED:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());

// Health
app.get("/", (req, res) => res.json({ message: "Route Planner API running 🚀" }));

// Geocode (Google)
app.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return res.status(400).json({ error: "Geocoding failed", details: data });

    // return lat/lng object compatible with frontend
    const loc = data.results[0].geometry.location;
    res.json({ lat: loc.lat, lng: loc.lng });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Geocoding error" });
  }
});

// Optimize (Directions API)
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;
    if (!stops || stops.length < 2) return res.status(400).json({ error: "At least two stops required" });

    const origin = `${stops[0].lat},${stops[0].lon ?? stops[0].lng}`;
    const destination = `${stops[stops.length-1].lat},${stops[stops.length-1].lon ?? stops[stops.length-1].lng}`;
    const waypoints = stops.length > 2
      ? stops.slice(1, -1).map(s => `${s.lat},${s.lon ?? s.lng}`).join("|")
      : "";

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

// Mark delivered (optional log)
let deliveredStops = [];
app.post("/mark-delivered", (req, res) => {
  try {
    const { stopId } = req.body;
    if (stopId === undefined) return res.status(400).json({ error: "stopId required" });
    deliveredStops.push(stopId);
    console.log("Delivered:", deliveredStops);
    res.json({ deliveredStops });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark delivered" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
