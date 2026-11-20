require("dotenv").config();
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const REQUIRED_ENV_VARS = [
  "META_VERIFY_TOKEN",
  "META_PAGE_ACCESS_TOKEN",
  "META_APP_SECRET",
];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;
const GRAPH_API_VERSION = "v27.0";
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const META_APP_SECRET = process.env.META_APP_SECRET;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

const leads = [];
const processedLeadIds = new Set();

function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !req.rawBody) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", META_APP_SECRET)
      .update(req.rawBody)
      .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expBuf);
}

function normalizeLead(rawLead) {
  const normalized = {
    id: rawLead.id,
    created_time: rawLead.created_time,
  };

  if (Array.isArray(rawLead.field_data)) {
    for (const field of rawLead.field_data) {
      normalized[field.name] = Array.isArray(field.values)
        ? field.values[0] || ""
        : "";
    }
  }

  return normalized;
}

async function processLead(leadgenId) {
  if (processedLeadIds.has(leadgenId)) {
    console.log(`Skipping duplicate leadgen_id: ${leadgenId}`);
    return;
  }

  processedLeadIds.add(leadgenId);

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${META_PAGE_ACCESS_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Meta API Error:", data);
      processedLeadIds.delete(leadgenId);
      return;
    }

    const lead = normalizeLead(data);
    leads.unshift(lead);
    console.log(`Stored and broadcasting lead: ${lead.id}`);
    io.emit("new_lead", lead);
  } catch (error) {
    console.error("Failed to fetch lead:", error);
    processedLeadIds.delete(leadgenId);
  }
}

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/leads", (req, res) => {
  res.json(leads);
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  if (!verifySignature(req)) {
    console.warn("Invalid webhook signature");
    return res.sendStatus(401);
  }

  if (req.body.object !== "page") {
    return res.sendStatus(404);
  }

  res.sendStatus(200);

  const entries = req.body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field === "leadgen" && change.value?.leadgen_id) {
        processLead(change.value.leadgen_id);
      }
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
