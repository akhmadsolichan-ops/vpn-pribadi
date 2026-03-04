#!/bin/bash

# MikroPanel VPS Auto-Setup Script
# Target: Ubuntu 24.04
# IP: 103.52.212.143

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting MikroPanel VPS Setup...${NC}"

# 1. Update System
echo -e "${GREEN}Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies
echo -e "${GREEN}Installing Node.js and VPN dependencies...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs sstp-server xl2tpd strongswan ppp build-essential sqlite3

# 3. Install PM2 and TSX
echo -e "${GREEN}Installing PM2 and TSX for background process management...${NC}"
sudo npm install -g pm2 tsx

# 4. Configure SSTP Server
echo -e "${GREEN}Configuring SSTP Server...${NC}"
# Basic SSTP Config
cat <<EOF | sudo tee /etc/sstpc.conf
# SSTP Config
EOF

# 5. Configure L2TP/IPSec (Strongswan)
echo -e "${GREEN}Configuring L2TP/IPSec...${NC}"
# Basic L2TP config
cat <<EOF | sudo tee /etc/ipsec.conf
config setup
    charondebug="ike 1, knl 1, cfg 0"
    uniqueids=no

conn L2TP-PSK
    type=transport
    keyexchange=ikev1
    authby=secret
    left=%any
    leftprotoport=17/1701
    right=%any
    rightprotoport=17/%any
    auto=add
EOF

cat <<EOF | sudo tee /etc/ipsec.secrets
: PSK "mikropanel-psk"
EOF

cat <<EOF | sudo tee /etc/xl2tpd/xl2tpd.conf
[global]
port = 1701

[lns default]
ip range = 10.10.10.10-10.10.10.200
local ip = 10.10.10.1
require chap = yes
refuse pap = yes
require authentication = yes
name = mikropanel-vpn
pppoptfile = /etc/ppp/options.xl2tpd
length bit = yes
EOF

cat <<EOF | sudo tee /etc/ppp/options.xl2tpd
require-chap
nocp
auth
nodefaultroute
lock
proxyarp
ms-dns 8.8.8.8
ms-dns 8.8.4.4
EOF

# 6. Setup MikroPanel App
echo -e "${GREEN}Setting up MikroPanel Web App...${NC}"
# Ensure we are in the project directory
npm install
npm run build

# 7. Start App with PM2
echo -e "${GREEN}Starting MikroPanel in background...${NC}"
# We run as root to allow writing to /etc/ppp/chap-secrets
sudo NODE_ENV=production pm2 start server.ts --name mikropanel --interpreter tsx

# 8. Save PM2 state
sudo pm2 save
sudo pm2 startup

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}Access your panel at: http://103.52.212.143:3000${NC}"
echo -e "${GREEN}Default Login: admin / admin123${NC}"
echo -e "${GREEN}========================================${NC}"
