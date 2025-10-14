import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ message: "Route Planner API running 🚀" }));

// POST /geocode
app.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return res.status(400).json({ error: "Geocoding failed", details: data });

    res.json(data.results[0].geometry.location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Geocoding error" });
  }
});

// POST /optimize
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;
    if (!stops || stops.length < 2) return res.status(400).json({ error: "At least two stops required" });

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length-1].lat},${stops[stops.length-1].lon}`;
    const waypoints = stops.slice(1, -1).map(s => `${s.lat},${s.lon}`).join("|");

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${process.env.GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return res.status(500).json({ error: "Directions API failed", details: data });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Route optimization error" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
