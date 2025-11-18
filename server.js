import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

if (!CLIENT_ORIGIN || !GOOGLE_MAPS_KEY) {
  console.error("Error: Missing CLIENT_ORIGIN or GOOGLE_MAPS_KEY");
  process.exit(1);
}

app.use(express.json());

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.get("/", (req, res) =>
  res.json({ message: "Route Planner API running 🚀" })
);

// ----------------------
// GEOCODE
// ----------------------
app.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_KEY}`;

    const r = await fetch(url);
    const data = await r.json();

    if (data.status !== "OK")
      return res.status(400).json({ error: "Geocode failed", details: data });

    res.json(data.results[0].geometry.location);
  } catch (err) {
    res.status(500).json({ error: "Geocode error" });
  }
});

// ----------------------
// OPTIMIZE ROUTE
// ----------------------
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;
    if (!stops || stops.length < 2)
      return res.status(400).json({ error: "At least two stops required" });

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;
    const waypoints =
      stops.length > 2
        ? stops.slice(1, -1).map((s) => `${s.lat},${s.lon}`).join("|")
        : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_MAPS_KEY}`;

    const r = await fetch(url);
    const data = await r.json();

    if (data.status !== "OK")
      return res.status(500).json({ error: "Directions failed", details: data });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Route optimization error" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
