import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // ✅ For cross-origin requests
import fetch from "node-fetch"; // ✅ Needed for fetch in Node.js

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ✅ Allow requests from any origin
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Route Planner API running 🚀" });
});

// ----------------------------
// POST /optimize endpoint
// ----------------------------
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;

    if (!stops || stops.length < 2)
      return res.status(400).json({ error: "At least two stops required." });

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;
    const waypoints = stops.slice(1, -1).map(s => `${s.lat},${s.lon}`).join("|");

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${process.env.GOOGLE_MAPS_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK")
      return res.status(500).json({ error: "Google Directions API failed", details: data });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Route optimization failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
