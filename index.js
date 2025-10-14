import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch"; // needed to call Google Maps API

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Route Planner API is running 🚀" });
});

// ----------------------------
// POST /optimize endpoint
// ----------------------------
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body; // [{ lat, lon }, { lat, lon }, ...]

    if (!stops || stops.length < 2) {
      return res.status(400).json({ error: "At least two stops are required." });
    }

    // Origin = first stop, Destination = last stop
    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;

    // Waypoints = stops between origin & destination, optimized
    const waypoints = stops
      .slice(1, -1)
      .map((s) => `${s.lat},${s.lon}`)
      .join("|");

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${process.env.GOOGLE_MAPS_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(500).json({ error: "Google Maps Directions API failed", details: data });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Route optimization failed" });
  }
});

// ----------------------------
// POST /geocode endpoint
// ----------------------------
app.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(400).json({ error: "Geocoding failed", details: data });
    }

    const location = data.results[0].geometry.location; // { lat, lng }
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Geocoding error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
