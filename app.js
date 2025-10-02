require('dotenv').config(); 

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const serverless = require("serverless-http");
const app = express();
const router = express.Router();
const port = 6000;

app.use(bodyParser.json());

// ✅ Tracking Pixel Route
router.get("/pixel/:sequence/:id.png", (req, res) => {
  const { sequence, id } = req.params;

  const logData = {
    time: new Date().toISOString(),
    sequence,
    id,
    ip: req.ip,
    ua: req.get("User-Agent"),
    referer: req.get("Referer"),
    qs: req.query,
  };

  console.log("Pixel hit:", logData);

  // Fire-and-forget webhook (non-blocking)
  axios.post("https://automations.aiagents.co.id/webhook/email-pixel-tracker", logData)
    .catch(err => console.error("Webhook POST failed:", err.message));

  // Send 1x1 transparent PNG
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    "base64"
  );

  res.set({
    "Content-Type": "image/png",
    "Content-Length": pixel.length,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  res.send(pixel);
});

// Register the router with the app
app.use('/', router); // Now your app uses the router for all routes starting with '/'

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
