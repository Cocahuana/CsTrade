# CS Trades API Server

Backend API server for CS Trades application. Handles Steam API requests to avoid CORS issues in the browser.

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

-   `PORT`: Server port (default: 5000)
-   `FRONTEND_URL`: Your frontend URL (default: http://localhost:3001)
-   `STEAM_API_KEY`: (Optional) Get from https://steamcommunity.com/dev/apikey

### 3. Run the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

### Get Steam Inventory

```
GET /api/steam/inventory/:steamId
```

Fetches CS2 inventory for a Steam user.

**Parameters:**

-   `steamId`: 17-digit Steam ID (e.g., 76561198358588609)

**Response:**

```json
{
  "success": true,
  "data": {
    "assets": [...],
    "descriptions": [...],
    "total_inventory_count": 45
  }
}
```

### Get Market Price

```
GET /api/steam/market/price/:marketHashName
```

Fetches Steam Market price for an item.

**Parameters:**

-   `marketHashName`: URL-encoded item name

**Example:**

```
/api/steam/market/price/AK-47%20%7C%20Redline%20(Field-Tested)
```

### Get User Profile

```
GET /api/steam/user/:steamId
```

Fetches user profile information (requires Steam API key).

## How It Works

1. **Frontend** makes request to our API server (http://localhost:5000)
2. **API server** fetches data from Steam's servers
3. **API server** returns data to frontend
4. **No CORS issues** because server-to-server requests don't have CORS restrictions

## Steam API Key

To get a Steam Web API key:

1. Go to https://steamcommunity.com/dev/apikey
2. Sign in with your Steam account
3. Enter a domain name (can be localhost for development)
4. Copy the key to your `.env` file

**Note:** The inventory endpoint works WITHOUT an API key. The key is only needed for other endpoints like user profiles.

## Error Handling

The API returns consistent error responses:

```json
{
	"success": false,
	"error": "Error message here"
}
```

Common errors:

-   `400`: Invalid Steam ID format
-   `403`: Inventory is private
-   `404`: Profile not found
-   `500`: Server error

## Rate Limiting

Steam has rate limits. Be careful not to spam requests. Consider implementing:

-   Request caching
-   Rate limiting middleware
-   Request queuing

## Next Steps

-   [ ] Add request caching (Redis)
-   [ ] Add rate limiting middleware
-   [ ] Add more Steam API endpoints
-   [ ] Add authentication for production
-   [ ] Deploy to production server
