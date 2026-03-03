import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("mikropanel.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    mikrotik_version TEXT,
    vpn_type TEXT,
    ip_vpn TEXT UNIQUE,
    vpn_username TEXT UNIQUE,
    vpn_password TEXT,
    status TEXT DEFAULT 'offline',
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER,
    event TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vpn_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default VPN settings
const sstpEnabled = db.prepare("SELECT * FROM vpn_settings WHERE key = ?").get("sstp_enabled");
if (!sstpEnabled) {
  db.prepare("INSERT INTO vpn_settings (key, value) VALUES (?, ?)").run("sstp_enabled", "true");
  db.prepare("INSERT INTO vpn_settings (key, value) VALUES (?, ?)").run("l2tp_enabled", "true");
  db.prepare("INSERT INTO vpn_settings (key, value) VALUES (?, ?)").run("vpn_server_ip", "103.52.212.143");
}

// Seed admin user if not exists (password: admin123 - in real app use bcrypt)
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "admin123");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/update-password", (req, res) => {
    const { username, newPassword } = req.body;
    try {
      db.prepare("UPDATE users SET password = ? WHERE username = ?").run(newPassword, username);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get("/api/devices", (req, res) => {
    const devices = db.prepare("SELECT * FROM devices ORDER BY created_at DESC").all();
    res.json(devices);
  });

  app.post("/api/devices", (req, res) => {
    const { name, location, mikrotik_version, vpn_type, ip_vpn, vpn_username, vpn_password } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO devices (name, location, mikrotik_version, vpn_type, ip_vpn, vpn_username, vpn_password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, location, mikrotik_version, vpn_type, ip_vpn, vpn_username, vpn_password);
      
      // Log the event
      db.prepare("INSERT INTO logs (device_id, event, details) VALUES (?, ?, ?)")
        .run(info.lastInsertRowid, "DEVICE_CREATED", `New device ${name} registered with IP ${ip_vpn}`);

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete("/api/devices/:id", (req, res) => {
    db.prepare("DELETE FROM devices WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/devices/:id/status", (req, res) => {
    const { status } = req.body;
    const device = db.prepare("SELECT name FROM devices WHERE id = ?").get(req.params.id) as any;
    
    db.prepare("UPDATE devices SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
    
    // Log status change if it's a significant change (optional, but good for NOC)
    // For now just log it
    db.prepare("INSERT INTO logs (device_id, event, details) VALUES (?, ?, ?)")
      .run(req.params.id, "STATUS_CHANGE", `Device ${device?.name} status changed to ${status}`);

    res.json({ success: true });
  });

  app.get("/api/logs", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, d.name as device_name 
      FROM logs l 
      LEFT JOIN devices d ON l.device_id = d.id 
      ORDER BY l.created_at DESC 
      LIMIT 100
    `).all();
    res.json(logs);
  });

  app.get("/api/vpn-settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM vpn_settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/vpn-settings", (req, res) => {
    const settings = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO vpn_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        stmt.run(key, String(value));
      }
    });
    transaction(settings);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
