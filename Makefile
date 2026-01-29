# ==========================
# MONOREPO: React + Node.js
# PM2 production runner
# ==========================

FRONTEND_DIR=frontend
BACKEND_DIR=backend

APP_NAME=monorepo-backend
# 3000 doludur deyə default 4000 qoyuram
PORT?=4000
NODE_ENV?=production

# Backend entry faylın fərqlidirsə, bunu dəyiş:
ENTRY?=index.js

# ----------- Basics ----------
install:
	@echo "📦 Installing dependencies..."
	cd $(BACKEND_DIR) && npm ci || npm install
	cd $(FRONTEND_DIR) && npm ci || npm install

build:
	@echo "🏗 Building React frontend..."
	cd $(FRONTEND_DIR) && npm run build

# ----------- PM2 -------------
pm2-start:
	@echo "🚀 Starting backend with PM2 on port $(PORT)..."
	cd $(BACKEND_DIR) && \
	PORT=$(PORT) NODE_ENV=$(NODE_ENV) pm2 start $(ENTRY) --name "$(APP_NAME)" --update-env

pm2-restart:
	@echo "🔁 Restarting backend with PM2 (port $(PORT))..."
	cd $(BACKEND_DIR) && \
	PORT=$(PORT) NODE_ENV=$(NODE_ENV) pm2 restart "$(APP_NAME)" --update-env

pm2-stop:
	@echo "🛑 Stopping backend..."
	pm2 stop "$(APP_NAME)" || true

pm2-delete:
	@echo "🗑 Deleting backend process from PM2..."
	pm2 delete "$(APP_NAME)" || true

pm2-status:
	pm2 status

pm2-logs:
	pm2 logs "$(APP_NAME)" --lines 200

pm2-save:
	@echo "💾 Saving PM2 process list..."
	pm2 save

pm2-startup:
	@echo "⚙️ Enabling PM2 startup on boot (needs sudo once)..."
	pm2 startup

# ----------- Deploy ----------
deploy: install build pm2-restart pm2-save
	@echo "✅ Deploy done. Backend on port $(PORT)."

first-deploy: install build pm2-start pm2-save
	@echo "✅ First deploy done. Backend on port $(PORT)."

# ----------- Utilities -------
port-check:
	@echo "🔎 Checking port $(PORT)..."
	@ss -ltnp | grep ":$(PORT) " || echo "✅ Port $(PORT) seems free."

clean:
	rm -rf $(BACKEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/build
