# 🏗️ Architecture Overview

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                          User's Browser                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           Frontend (React + TypeScript)                   │ │
│  │           Running on http://localhost:3001                │ │
│  │                                                           │ │
│  │  - Inventory Analyzer UI                                  │ │
│  │  - Trade-Up Calculator                                    │ │
│  │  - Redux State Management                                 │ │
│  │  - RTK Query for API calls                               │ │
│  └───────────────────┬───────────────────────────────────────┘ │
│                      │                                          │
│                      │ HTTP Requests                            │
│                      │ (No CORS issues!)                        │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend API Server (Express.js)                    │
│              Running on http://localhost:5000                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    API Endpoints                          │ │
│  │                                                           │ │
│  │  GET /api/steam/inventory/:steamId                       │ │
│  │  GET /api/steam/market/price/:itemName                   │ │
│  │  GET /api/steam/user/:steamId                            │ │
│  │  GET /health                                             │ │
│  └───────────────────┬───────────────────────────────────────┘ │
│                      │                                          │
│                      │ Server-to-Server                         │
│                      │ (No CORS restrictions)                   │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Steam Community API                            │
│           https://steamcommunity.com/...                        │
│                                                                 │
│  - Inventory data                                              │
│  - Market prices                                               │
│  - User profiles                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Loading User Inventory

1. **User Input**

    ```
    User enters Steam ID: 76561198358588609
    ```

2. **Frontend Request**

    ```javascript
    fetch("http://localhost:5000/api/steam/inventory/76561198358588609");
    ```

3. **Backend Processing**

    ```javascript
    // api/src/routes/steam.js
    router.get("/inventory/:steamId", async (req, res) => {
    	const steamUrl = `https://steamcommunity.com/inventory/${steamId}/730/2`;
    	const response = await fetch(steamUrl);
    	const data = await response.json();
    	res.json({ success: true, data });
    });
    ```

4. **Steam Response**

    ```json
    {
      "success": 1,
      "assets": [...],
      "descriptions": [...],
      "total_inventory_count": 45
    }
    ```

5. **Frontend Processing**
    ```typescript
    // Process items, filter tradable weapons, display in UI
    const processedItems = processInventory(data);
    ```

## Why This Architecture?

### ❌ Without Backend (CORS Problem)

```
Browser → Steam API ❌ BLOCKED by CORS
```

### ✅ With Backend (No CORS)

```
Browser → Our API Server → Steam API ✅ WORKS
```

## Key Components

### Frontend (`src/`)

-   **React Components**: UI for calculator and inventory analyzer
-   **Redux Store**: State management for inventory, prices, settings
-   **RTK Query**: API calls with caching
-   **TypeScript**: Type safety
-   **Tailwind CSS**: Styling

### Backend (`api/src/`)

-   **Express Server**: HTTP server
-   **Steam Routes**: API endpoints for Steam data
-   **CORS Middleware**: Allows frontend to connect
-   **Error Handling**: Consistent error responses
-   **Logging**: Request logging

## Environment Variables

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend `api/.env`

```env
PORT=5000
FRONTEND_URL=http://localhost:3001
STEAM_API_KEY=optional
```

## Security Considerations

### Current (Development)

-   ✅ CORS enabled for localhost
-   ✅ No sensitive data stored
-   ✅ No database required
-   ⚠️ Steam API key optional (inventory works without it)

### For Production

-   [ ] Add authentication/API keys
-   [ ] Rate limiting per IP
-   [ ] Request caching (Redis)
-   [ ] Restrict CORS to production domain
-   [ ] Use environment-specific configs
-   [ ] Add monitoring/logging
-   [ ] Deploy to cloud (Vercel, Railway, etc.)

## Performance Optimization

### Current

-   RTK Query caching (5-10 minutes)
-   Lazy loading components
-   Optimized builds with Vite

### Future Improvements

-   [ ] Redis caching for Steam API responses
-   [ ] Database for historical prices
-   [ ] WebSocket for real-time updates
-   [ ] CDN for static assets
-   [ ] Load balancing for high traffic

## Tech Stack Summary

**Frontend:**

-   React 18.3
-   TypeScript 5.x
-   Redux Toolkit
-   RTK Query
-   Tailwind CSS 3.x
-   Vite 7.x

**Backend:**

-   Node.js (ES Modules)
-   Express.js 4.x
-   CORS middleware
-   dotenv for config
-   node-fetch for Steam API

**APIs:**

-   Steam Community API
-   Skinport API
-   (Optional) Steam Web API
