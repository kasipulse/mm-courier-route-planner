import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Route Planner API running 🚀" });
});

// Optimize route
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body; // [{ lat, lon }, { lat, lon }]

    if (!stops || stops.length < 2)
      return res.status(400).json({ error: "At least 2 stops required." });

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;
    const waypoints = stops.slice(1, -1).map(s => `${s.lat},${s.lon}`).join("|");

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${process.env.GOOGLE_MAPS_KEY}`;

    const response = await fetch(url); // built-in fetch in Node 18+
    const data = await response.json();

    if (data.status !== "OK")
      return res.status(500).json({ error: "Google API failed", details: data });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Route optimization failed" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
