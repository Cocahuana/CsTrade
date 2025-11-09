# 📚 API Reference - Complete Documentation

## 🎯 Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication
Currently no authentication required (add JWT/OAuth later for production)

---

## 📦 **Prices Endpoints** (NEW - With DB Caching)

### **GET /api/prices/:marketHashName**
Get price for a specific item (with automatic caching)

**Parameters:**
- `marketHashName` (path) - Market hash name (e.g., "AK-47 | Redline (Field-Tested)")

**Response:**
```json
{
  "success": true,
  "data": {
    "marketHashName": "AK-47 | Redline (Field-Tested)",
    "price": 45.20,
    "lowestPrice": 45.20,
    "medianPrice": 46.50,
    "volume": 234,
    "source": "steam",
    "timestamp": 1699384800000,
    "cached": true
  }
}
```

**Features:**
- ✅ Automatic DB caching (60min default)
- ✅ Returns cached data instantly if available
- ✅ Auto-fetches from Steam if expired/missing

---

### **POST /api/prices/batch**
Batch fetch prices with intelligent caching

**Body:**
```json
{
  "marketHashNames": [
    "AK-47 | Redline (Field-Tested)",
    "AWP | Asiimov (Field-Tested)"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "AK-47 | Redline (Field-Tested)": {
      "marketHashName": "AK-47 | Redline (Field-Tested)",
      "price": 45.20,
      "lowestPrice": 45.20,
      "medianPrice": 46.50,
      "volume": 234,
      "source": "steam",
      "timestamp": 1699384800000,
      "cached": true
    },
    // ... more items
  },
  "stats": {
    "requested": 2,
    "fetched": 2,
    "fromCache": 1,
    "fromSteam": 1,
    "failed": 0
  }
}
```

**Features:**
- ✅ Returns cached prices instantly
- ✅ Fetches only missing/expired prices
- ✅ Respects Steam rate limits (1.5s between requests)

---

### **DELETE /api/prices/cache**
Clear price cache (admin/development)

**Query Parameters:**
- `olderThan` (optional) - Delete prices older than X minutes

**Examples:**
```bash
# Clear all cache
DELETE /api/prices/cache

# Clear prices older than 2 hours
DELETE /api/prices/cache?olderThan=120
```

---

## 📊 **Trade-Ups Endpoints** (NEW)

### **POST /api/tradeups**
Create/save a trade-up

**Body:**
```json
{
  "steamId": "76561198358588609",
  "inputs": [
    {
      "name": "AK-47 | Redline",
      "marketHashName": "AK-47 | Redline (Field-Tested)",
      "price": 4.50,
      "rarity": "Classified",
      "collection": "The Prisma Collection"
    }
    // ... 10 items total
  ],
  "predictedOutcomes": [
    {
      "name": "AWP | Asiimov",
      "marketHashName": "AWP | Asiimov (Field-Tested)",
      "probability": 0.7,
      "estimatedPrice": 65.00
    }
    // ... more outcomes
  ],
  "stats": {
    "totalCost": 45.00,
    "expectedValue": 52.80,
    "expectedProfit": 7.80,
    "profitability": 17.3,
    "oddsToProfit": 65.0
  },
  "notes": "High probability Prisma trade-up",
  "actualOutcome": null,
  "actualPrice": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "...",
    "steamId": "76561198358588609",
    "status": "planned",
    "profitability": 17.3,
    "createdAt": "2024-11-08T12:00:00.000Z"
  }
}
```

---

### **GET /api/tradeups/user/:steamId**
Get all trade-ups for a user

**Parameters:**
- `steamId` (path) - Steam ID
- `status` (query, optional) - Filter by status: `planned`, `completed`, `profit`, `loss`
- `limit` (query, optional) - Results per page (default: 50)
- `offset` (query, optional) - Offset for pagination (default: 0)

**Examples:**
```bash
GET /api/tradeups/user/76561198358588609
GET /api/tradeups/user/76561198358588609?status=profit
GET /api/tradeups/user/76561198358588609?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "inputs": [...],
      "predictedOutcomes": [...],
      "totalCost": 45.00,
      "expectedValue": 52.80,
      "expectedProfit": 7.80,
      "profitability": 17.3,
      "oddsToProfit": 65.0,
      "actualOutcome": "AWP | Asiimov (Field-Tested)",
      "actualPrice": 65.00,
      "actualProfit": 20.00,
      "status": "profit",
      "notes": "Great trade-up!",
      "completedAt": "2024-11-08T13:00:00.000Z",
      "createdAt": "2024-11-08T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### **GET /api/tradeups/:id**
Get a specific trade-up by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "steamId": "76561198358588609",
    "inputs": [...],
    "predictedOutcomes": [...],
    // ... full trade-up details
  }
}
```

---

### **PUT /api/tradeups/:id/complete**
Mark a trade-up as completed

**Body:**
```json
{
  "actualOutcome": "AWP | Asiimov (Field-Tested)",
  "actualPrice": 65.00,
  "notes": "Better than expected!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "actualOutcome": "AWP | Asiimov (Field-Tested)",
    "actualPrice": 65.00,
    "actualProfit": 20.00,
    "status": "profit",
    "completedAt": "2024-11-08T13:00:00.000Z"
  }
}
```

---

### **PUT /api/tradeups/:id**
Update trade-up notes

**Body:**
```json
{
  "notes": "Updated notes"
}
```

---

### **DELETE /api/tradeups/:id**
Delete a trade-up

**Response:**
```json
{
  "success": true,
  "message": "Trade-up deleted successfully"
}
```

---

### **GET /api/tradeups/user/:steamId/stats**
Get user statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "steamId": "76561198358588609",
      "steamName": "PlayerName",
      "totalTradeUps": 45,
      "profitableTradeUps": 28,
      "totalProfit": 234.50,
      "lastActive": "2024-11-08T12:00:00.000Z"
    },
    "stats": {
      "total": 45,
      "profitable": 28,
      "totalProfit": 234.50,
      "avgProfitability": 15.6,
      "winRate": 62.22
    },
    "recentTradeUps": [
      // 10 most recent trade-ups
    ]
  }
}
```

---

## 👤 **Users Endpoints** (NEW)

### **GET /api/users/:steamId**
Get user profile

**Response:**
```json
{
  "success": true,
  "data": {
    "steamId": "76561198358588609",
    "steamName": "PlayerName",
    "avatarUrl": "https://...",
    "totalTradeUps": 45,
    "profitableTradeUps": 28,
    "totalProfit": 234.50,
    "winRate": 62.22,
    "lastActive": "2024-11-08T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### **POST /api/users**
Create or update user

**Body:**
```json
{
  "steamId": "76561198358588609",
  "steamName": "PlayerName",
  "avatarUrl": "https://..."
}
```

---

### **PUT /api/users/:steamId**
Update user profile

**Body:**
```json
{
  "steamName": "NewName",
  "avatarUrl": "https://..."
}
```

---

### **GET /api/users/:steamId/refresh-stats**
Manually refresh user statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTradeUps": 45,
    "profitableTradeUps": 28,
    "totalProfit": 234.50,
    "winRate": 62.22
  }
}
```

---

## 🎮 **Steam Endpoints** (Existing - Now with DB Cache)

### **GET /api/steam/inventory/:steamId**
Fetch CS2 inventory

**Response:** Array of inventory items

---

### **POST /api/steam/market/prices/batch** (Updated)
Batch price fetching - Now uses DB cache automatically!

**Same as `/api/prices/batch`** - kept for backward compatibility

---

### **GET /api/steam/items/all**
Get CS2 metadata (collections, rarities, etc.)

---

### **GET /api/steam/items/collection-items**
Get collection items database

---

### **POST /api/steam/items/outcomes**
Calculate trade-up outcomes

---

## 📊 **Error Responses**

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error

---

## 🚀 **Usage Examples**

### **Complete Trade-Up Flow**

```javascript
// 1. Save a planned trade-up
const response = await fetch('/api/tradeups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    steamId: '76561198358588609',
    inputs: [...],
    predictedOutcomes: [...],
    stats: {...}
  })
});

const { data } = await response.json();
const tradeUpId = data.id;

// 2. User performs the trade-up in CS2

// 3. Mark as completed
await fetch(`/api/tradeups/${tradeUpId}/complete`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    actualOutcome: 'AWP | Asiimov (Field-Tested)',
    actualPrice: 65.00
  })
});

// 4. Get user stats
const stats = await fetch(`/api/tradeups/user/${steamId}/stats`);
```

---

### **Price Caching Flow**

```javascript
// First request - fetches from Steam (slow)
const prices1 = await fetch('/api/prices/batch', {
  method: 'POST',
  body: JSON.stringify({
    marketHashNames: ['AK-47 | Redline (Field-Tested)']
  })
});
// Takes ~1.5 seconds

// Second request within 60min - from cache (instant!)
const prices2 = await fetch('/api/prices/batch', {
  method: 'POST',
  body: JSON.stringify({
    marketHashNames: ['AK-47 | Redline (Field-Tested)']
  })
});
// Takes ~10ms ⚡
```

---

## 🔧 **Configuration**

Set in `api/.env`:

```env
# Cache duration
PRICE_CACHE_MINUTES=60        # How long to cache prices
FLOAT_CACHE_DAYS=365         # Float values (permanent)

# Database
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=cstrades_dev
DB_HOST=localhost
DB_PORT=5432
```

---

## 📝 **Database Schema**

### **prices** table
- `market_hash_name` (unique) - Item name
- `price` - Current price
- `updated_at` - Last update time
- Expires after `PRICE_CACHE_MINUTES`

### **users** table
- `steam_id` (unique) - Steam ID
- `total_trade_ups` - Total count
- `profitable_trade_ups` - Win count
- `total_profit` - Cumulative profit

### **trade_ups** table
- `user_id` (FK) - Owner
- `inputs_data` (JSONB) - Input items
- `predicted_outcomes` (JSONB) - Predictions
- `status` - planned/completed/profit/loss
- `actual_outcome` - What they got
- `actual_profit` - Real profit/loss

---

## 🎯 **Best Practices**

1. **Always check cache first** - prices endpoint does this automatically
2. **Save trade-ups before executing** - helps with analytics
3. **Complete trade-ups after** - tracks actual results
4. **Use pagination** - for large history lists
5. **Refresh stats periodically** - keeps data accurate

---

## 🚀 **Next Steps**

- Add authentication (JWT/OAuth)
- Implement rate limiting per user
- Add WebSocket for real-time updates
- Export trade history to CSV
- Add filters and search to trade-up history

---

**Documentation Last Updated:** 2024-11-08

