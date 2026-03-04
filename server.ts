import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs";
import { RouterOSAPI } from "node-routeros";

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

  CREATE TABLE IF NOT EXISTS gateways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    host TEXT,
    port INTEGER DEFAULT 8728,
    username TEXT,
    password TEXT,
    status TEXT DEFAULT 'offline',
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vpn_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gateway_id INTEGER,
    username TEXT,
    password TEXT,
    service TEXT DEFAULT 'l2tp',
    profile TEXT DEFAULT 'default',
    comment TEXT,
    status TEXT DEFAULT 'offline',
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(gateway_id) REFERENCES gateways(id) ON DELETE CASCADE,
    UNIQUE(gateway_id, username)
  );

  // Migration: Add is_disabled to vpn_accounts if not exists
  try {
    const tableInfo = db.prepare("PRAGMA table_info(vpn_accounts)").all() as any[];
    const hasDisabled = tableInfo.some(col => col.name === 'is_disabled');
    if (!hasDisabled) {
      db.exec("ALTER TABLE vpn_accounts ADD COLUMN is_disabled INTEGER DEFAULT 0");
    }
  } catch (e) {}

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gateway_id INTEGER,
    event TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vpn_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Check if logs table has device_id instead of gateway_id
try {
  const tableInfo = db.prepare("PRAGMA table_info(logs)").all() as any[];
  const hasDeviceId = tableInfo.some(col => col.name === 'device_id');
  const hasGatewayId = tableInfo.some(col => col.name === 'gateway_id');
  
  if (hasDeviceId && !hasGatewayId) {
    console.log("Migrating logs table: device_id -> gateway_id");
    db.exec("ALTER TABLE logs RENAME COLUMN device_id TO gateway_id");
  } else if (!hasGatewayId) {
    // If somehow it's missing entirely or in a weird state, recreate
    console.log("Recreating logs table...");
    db.exec("DROP TABLE IF EXISTS logs");
    db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gateway_id INTEGER,
        event TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
      );
    `);
  }
} catch (e) {
  console.error("Migration error:", e);
}

// Seed default VPN settings
const sstpEnabled = db.prepare("SELECT * FROM vpn_settings WHERE key = ?").get("sstp_enabled");
if (!sstpEnabled) {
  db.prepare("INSERT INTO vpn_settings (key, value) VALUES (?, ?)").run("sstp_enabled", "true");
  db.prepare("INSERT INTO vpn_settings (key, value) VALUES (?, ?)").run("l2tp_enabled", "true");
  db.prepare("INSERT INTO vpn_settings (key, value) VALUES (?, ?)").run("vpn_server_ip", "103.52.212.143");
  db.prepare("INSERT INTO vpn_settings (key, value) VALUES (?, ?)").run("global_psk", "mikropanel-psk");
}

// Seed admin user if not exists (password: admin123 - in real app use bcrypt)
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "admin123");
}

/**
 * MikroTik API Helper
 */
const getRosClient = (gateway: any) => {
  return new RouterOSAPI({
    host: gateway.host,
    user: gateway.username,
    password: gateway.password,
    port: gateway.port,
    timeout: 5
  });
};

/**
 * Monitoring Logic
 * Checks Gateway reachability and Active VPN Sessions
 */
const monitorGateways = async () => {
  const gateways = db.prepare("SELECT * FROM gateways").all() as any[];
  
  for (const gateway of gateways) {
    const client = getRosClient(gateway);
    try {
      await client.connect();
      
      // Update Gateway Status
      const oldStatus = gateway.status;
      db.prepare("UPDATE gateways SET status = 'online', last_seen = CURRENT_TIMESTAMP WHERE id = ?").run(gateway.id);
      
      if (oldStatus !== 'online') {
        db.prepare("INSERT INTO logs (gateway_id, event, details) VALUES (?, ?, ?)")
          .run(gateway.id, 'GATEWAY_ONLINE', `Gateway ${gateway.name} is now online`);
      }

      // Fetch Active PPP Sessions
      const activeSessions = await client.write("/ppp/active/print");
      
      // Reset all accounts for this gateway to offline first
      const accounts = db.prepare("SELECT * FROM vpn_accounts WHERE gateway_id = ?").all() as any[];
      
      // Update status for active accounts
      const activeUsernames = activeSessions.map((s: any) => s.name);
      
      for (const account of accounts) {
        const isActive = activeUsernames.includes(account.username);
        const newStatus = isActive ? 'online' : 'offline';
        
        if (account.status !== newStatus) {
          db.prepare("UPDATE vpn_accounts SET status = ?, last_seen = ? WHERE id = ?")
            .run(newStatus, isActive ? new Date().toISOString() : account.last_seen, account.id);
          
          db.prepare("INSERT INTO logs (gateway_id, event, details) VALUES (?, ?, ?)")
            .run(gateway.id, 'ACCOUNT_STATUS', `Account ${account.username} is now ${newStatus}`);
        }
      }

      await client.close();
    } catch (error: any) {
      if (gateway.status !== 'offline') {
        console.error(`Gateway ${gateway.name} Monitor Error:`, error.message || error);
        db.prepare("UPDATE gateways SET status = 'offline' WHERE id = ?").run(gateway.id);
        db.prepare("INSERT INTO logs (gateway_id, event, details) VALUES (?, ?, ?)")
          .run(gateway.id, 'GATEWAY_OFFLINE', `Gateway ${gateway.name} is now offline: ${error.message || 'Connection failed'}`);
      }
    }
  }
};

// Start monitoring loop every 15 seconds
setInterval(monitorGateways, 15000);

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

  // --- Gateways API ---
  app.get("/api/gateways", (req, res) => {
    const gateways = db.prepare("SELECT * FROM gateways ORDER BY created_at DESC").all();
    res.json(gateways);
  });

  app.post("/api/gateways", (req, res) => {
    const { name, host, port, username, password } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO gateways (name, host, port, username, password)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, host, port || 8728, username, password);
      
      db.prepare("INSERT INTO logs (gateway_id, event, details) VALUES (?, ?, ?)")
        .run(info.lastInsertRowid, 'GATEWAY_CREATED', `Gateway ${name} registered`);
        
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete("/api/gateways/:id", (req, res) => {
    db.prepare("DELETE FROM gateways WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- VPN Accounts API ---
  app.get("/api/vpn-accounts", (req, res) => {
    const accounts = db.prepare(`
      SELECT v.*, g.name as gateway_name 
      FROM vpn_accounts v 
      JOIN gateways g ON v.gateway_id = g.id 
      ORDER BY v.created_at DESC
    `).all();
    res.json(accounts);
  });

  app.post("/api/vpn-accounts", async (req, res) => {
    const { gateway_id, username, password, service, profile, comment } = req.body;
    const gateway = db.prepare("SELECT * FROM gateways WHERE id = ?").get(gateway_id) as any;
    
    if (!gateway) return res.status(404).json({ success: false, message: "Gateway not found" });

    const client = getRosClient(gateway);
    try {
      await client.connect();
      
      // Check if user exists on MikroTik
      const existing = await client.write("/ppp/secret/print", [
        `?.name=${username}`
      ]);
      
      if (existing.length > 0) {
        // Update
        await client.write("/ppp/secret/set", [
          `=.id=${existing[0][".id"]}`,
          `=password=${password}`,
          `=service=${service || 'l2tp'}`,
          `=profile=${profile || 'default'}`,
          `=comment=${comment || ''}`
        ]);
      } else {
        // Add
        await client.write("/ppp/secret/add", [
          `=name=${username}`,
          `=password=${password}`,
          `=service=${service || 'l2tp'}`,
          `=profile=${profile || 'default'}`,
          `=comment=${comment || ''}`
        ]);
      }

      // Sync to local DB
      db.prepare(`
        INSERT INTO vpn_accounts (gateway_id, username, password, service, profile, comment)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(gateway_id, username) DO UPDATE SET
          password = excluded.password,
          service = excluded.service,
          profile = excluded.profile,
          comment = excluded.comment
      `).run(gateway_id, username, password, service, profile, comment);

      db.prepare("INSERT INTO logs (gateway_id, event, details) VALUES (?, ?, ?)")
        .run(gateway_id, 'ACCOUNT_SYNCED', `VPN Account ${username} synced to MikroTik`);

      await client.close();
      res.json({ success: true });
    } catch (error: any) {
      console.error("MikroTik API Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete("/api/vpn-accounts/:id", async (req, res) => {
    const account = db.prepare("SELECT * FROM vpn_accounts WHERE id = ?").get(req.params.id) as any;
    if (!account) return res.status(404).json({ success: false, message: "Account not found" });

    const gateway = db.prepare("SELECT * FROM gateways WHERE id = ?").get(account.gateway_id) as any;
    if (gateway) {
      const client = getRosClient(gateway);
      try {
        await client.connect();
        const existing = await client.write("/ppp/secret/print", [
          `?.name=${account.username}`
        ]);
        if (existing.length > 0) {
          await client.write("/ppp/secret/remove", [
            `=.id=${existing[0][".id"]}`
          ]);
        }
        await client.close();
      } catch (e) {
        console.error("Failed to remove from MikroTik:", e);
      }
    }

    db.prepare("DELETE FROM vpn_accounts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/vpn-accounts/:id/toggle", async (req, res) => {
    const account = db.prepare("SELECT * FROM vpn_accounts WHERE id = ?").get(req.params.id) as any;
    if (!account) return res.status(404).json({ success: false, message: "Account not found" });

    const newDisabled = account.is_disabled ? 0 : 1;
    const gateway = db.prepare("SELECT * FROM gateways WHERE id = ?").get(account.gateway_id) as any;

    if (gateway) {
      const client = getRosClient(gateway);
      try {
        await client.connect();
        const existing = await client.write("/ppp/secret/print", [
          `?.name=${account.username}`
        ]);
        if (existing.length > 0) {
          await client.write("/ppp/secret/set", [
            `=.id=${existing[0][".id"]}`,
            `=disabled=${newDisabled ? 'yes' : 'no'}`
          ]);
        }
        await client.close();
      } catch (e: any) {
        return res.status(500).json({ success: false, message: e.message });
      }
    }

    db.prepare("UPDATE vpn_accounts SET is_disabled = ? WHERE id = ?").run(newDisabled, req.params.id);
    res.json({ success: true, is_disabled: newDisabled });
  });

  app.get("/api/logs", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, g.name as gateway_name 
      FROM logs l 
      LEFT JOIN gateways g ON l.gateway_id = g.id 
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
