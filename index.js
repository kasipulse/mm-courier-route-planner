import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ Allow your UI domain ONLY (safer)
app.use(
  cors({
    origin: [
      "https://mm-courier-route-planner-ui.onrender.com",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ----------------------
// Health Check
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

    if (!stops || stops.length < 2)
      return res.status(400).json({ error: "At least two stops required." });

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}`;

    const waypoints =
      stops.length > 2
        ? stops.slice(1, -1).map(s => `${s.lat},${s.lon}`).join("|")
        : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${process.env.GOOGLE_MAPS_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google API error:", data);
      return res.status(500).json({
        error: "Google Directions API failed",
        details: data
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
