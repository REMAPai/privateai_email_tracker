require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
const router = express.Router();
const port = 6049;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// ==========================
// VARIANT CONFIGURATION
// ==========================
// Info:
// /pixel-newclient/:sequence/:id.png
// /webhook/email-pixel-tracker-newclient
const variants = [
  "nicole",
  "internal",
];

// ==========================
// PIXEL HANDLER FACTORY
// ==========================

function pixelHandler(webhookUrl) {
  return (req, res) => {
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

    // Fire-and-forget webhook
    axios
      .post(webhookUrl, logData)
      .catch((err) =>
        console.error("Webhook POST failed:", err.message)
      );

    // 1x1 transparent PNG
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
  };
}

// ==========================
// DYNAMIC ROUTE REGISTRATION
// ==========================

variants.forEach((name) => {
  const pixelRoute = `/pixel-${name}/:sequence/:id.png`;
  const webhookUrl = `https://automations.aiagents.co.id/webhook/email-pixel-tracker-${name}`;

  router.get(pixelRoute, pixelHandler(webhookUrl));

  console.log(`Registered route: ${pixelRoute} → ${webhookUrl}`);
});

// Optional: Base route without postfix
router.get(
  "/pixel/:sequence/:id.png",
  pixelHandler("https://automations.aiagents.co.id/webhook/email-pixel-tracker")
);

router.get("/", (req, res) => {
  res.send("Hello! :D");
});


// ==========================
// REGISTER ROUTER
// ==========================
app.use("/", router);

// ==========================
// START SERVER
// ==========================
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
