# 🚀 MikroPanel VPS Deployment Guide

This guide will help you deploy the MikroPanel NOC Dashboard to your Ubuntu 24.04 VPS (`103.52.212.143`) and ensure it runs permanently in the background.

## 📋 Prerequisites
- Ubuntu 24.04 VPS
- Root access (sudo)
- Port 3000 (Web), 443 (SSTP), 500/4500 (L2TP/IPSec) open in firewall

## 🛠️ One-Click Installation

1. **Push your code to GitHub:**
   If you haven't already, push this project to your repository:
   ```bash
   git add .
   git commit -m "Refactor: NOC Dashboard & VPN Architecture"
   git push origin main
   ```

2. **Connect to your VPS via SSH:**
   ```bash
   ssh root@103.52.212.143
   ```

2. **Clone your repository:**
   ```bash
   git clone https://github.com/akhmadsolichan-ops/vpn-pribadi.git
   cd vpn-pribadi
   ```

3. **Run the setup script:**
   ```bash
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```

## 🔍 What this script does:
- **Updates System:** Ensures your Ubuntu is up to date.
- **Installs Node.js & VPN:** Installs Node.js 20, SSTP, L2TP, and IPSec components.
- **Configures VPN:** Sets up basic configuration for SSTP and L2TP/IPSec.
- **Builds App:** Installs dependencies and builds the React frontend.
- **Background Process:** Uses **PM2** to run the server permanently. It will restart automatically if the VPS reboots.

## 🖥️ Accessing the Panel
Once the script finishes, you can access the dashboard at:
**http://103.52.212.143:3000**

- **Default Username:** `admin`
- **Default Password:** `admin123`

## 🛡️ Security Notes
- **Change Password:** Immediately go to the **Settings** tab in the panel and change your admin password.
- **VPN Secret:** The default L2TP IPSec PSK is `mikropanel-psk`. You can change this in `/etc/ipsec.secrets`.
- **Syncing:** The panel automatically updates `/etc/ppp/chap-secrets` whenever you add or delete a device.

## 📊 Monitoring
To check the status of your background process:
```bash
pm2 status
pm2 logs mikropanel
```

To restart the panel:
```bash
pm2 restart mikropanel
```
