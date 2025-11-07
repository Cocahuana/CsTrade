# 🚀 Quick Start Guide

## Starting the Application

### Step 1: Start Backend API Server

Open a terminal and run:

```bash
cd api
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```

Or if you have npm working:

```bash
cd api
npm run dev
```

You should see:

```
🚀 CS Trades API Server running on port 5000
📡 Frontend URL: http://localhost:3001
```

### Step 2: Start Frontend Application

Open a NEW terminal (keep the backend running) and run:

```bash
node node_modules/vite/bin/vite.js
```

You should see:

```
VITE ready in XXX ms
➜ Local: http://localhost:3001/
```

### Step 3: Use the Application

1. Open **http://localhost:3001** in your browser
2. Go to **Inventory Analyzer**
3. Enter your Steam ID: `76561198358588609`
4. Click **Load Inventory**

## Checking if Everything Works

### Backend Health Check

Open: http://localhost:5000/health

Should return:

```json
{
	"status": "ok",
	"message": "CS Trades API Server is running"
}
```

### Test Inventory Endpoint

Open: http://localhost:5000/api/steam/inventory/76561198358588609

Should return your inventory data!

## Common Issues

### ❌ "Failed to connect to backend API"

**Solution:** Make sure the backend server is running in a separate terminal

### ❌ "Inventory is private"

**Solution:**

1. Go to Steam → Profile → Privacy Settings
2. Set "My profile" to PUBLIC
3. Set "Game details" to PUBLIC

### ❌ PowerShell script execution error

**Solution:** Use the node command directly:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```

## What's Next?

-   ✅ Backend API server running on port 5000
-   ✅ Frontend app running on port 3001
-   ✅ No more CORS issues!
-   ✅ Direct connection to Steam's API through our server

Now you can:

1. Load your Steam inventory
2. Analyze profitable trade-ups
3. Calculate expected values
4. Find the best combinations automatically!

## File Structure

```
csTrades/
├── api/                          # Backend Express.js Server
│   ├── src/
│   │   ├── server.js            # Main server file
│   │   ├── routes/steam.js      # Steam API endpoints
│   │   └── middleware/          # Error handling, logging
│   ├── .env                     # Backend configuration
│   └── package.json
│
├── src/                         # Frontend React App
│   ├── config/api.ts           # API configuration (uses backend)
│   ├── store/api/steamApi.ts   # RTK Query API calls
│   └── components/             # React components
│
└── .env                        # Frontend configuration
```

Enjoy! 🎮
