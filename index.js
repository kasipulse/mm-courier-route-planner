import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------
// CORS FIX
// ----------------------------
app.use(cors({
  origin: "*",          // Allow ALL UI domains
  methods: "GET,POST",  
  allowedHeaders: "Content-Type",
}));

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Route Planner API running 🚀" });
});

// ----------------------------
// POST /optimize
// ----------------------------
app.post("/optimize", async (req, res) => {
  try {
    const { stops } = req.body;

    if (!stops || stops.length < 2) {
      return res.status(400).json({
        error: "At least two stops required.",
      });
    }

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;

    const waypoints = stops
      .slice(1, -1)
      .map(s => `${s.lat},${s.lon}`)
      .join("|");

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${process.env.GOOGLE_MAPS_KEY}`;

    // ❗ Node 22 has built-in fetch — NO node-fetch needed
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(500).json({
        error: "Google Directions API failed",
        details: data,
      });
    }

    res.json(data);

  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    res.status(500).json({
      error: "Route optimization failed",
      details: err.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
