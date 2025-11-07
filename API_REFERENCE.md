# Quick API Reference

## Steam Inventory

### Get Inventory

```
GET https://steamcommunity.com/inventory/{steamId}/730/2?l=english&count=5000
```

**Parameters:**

-   `steamId`: Steam 64-bit ID
-   `730`: CS2 App ID
-   `2`: Community items context ID

**Response:**

```json
{
  "assets": [{ "assetid": "...", "classid": "...", ... }],
  "descriptions": [{ "name": "AK-47 | Redline", "market_hash_name": "...", ... }],
  "total_inventory_count": 123,
  "success": 1
}
```

**CORS**: ⚠️ Blocked - Use proxy

```typescript
const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
	inventoryUrl
)}`;
```

## Skinport Prices

### Get All Items

```
GET https://api.skinport.com/v1/items?app_id=730&currency=USD
```

**Parameters:**

-   `app_id`: 730 (CS2)
-   `currency`: USD, EUR, etc.

**Response:**

```json
{
	"items": [
		{
			"market_hash_name": "AK-47 | Redline (Field-Tested)",
			"currency": "USD",
			"suggested_price": 45.5,
			"min_price": 44.0,
			"max_price": 50.0,
			"median_price": 45.5,
			"quantity": 123
		}
	]
}
```

**CORS**: ✅ Allowed - Direct access
**Rate Limit**: ~10 req/sec

## Steam Market (Alternative)

### Get Item Price

```
GET https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name={name}
```

**Parameters:**

-   `appid`: 730
-   `currency`: 1 (USD), 3 (EUR), etc.
-   `market_hash_name`: URL-encoded item name

**Response:**

```json
{
	"success": true,
	"lowest_price": "$45.50",
	"volume": "123",
	"median_price": "$46.00"
}
```

**CORS**: ⚠️ Blocked - Use proxy
**Rate Limit**: ⚠️ Very strict (1 req/sec)

## CSGOFloat API

### Get Item Float

```
GET https://csgofloat.com/api/v1/listings?market_hash_name={name}
```

**Requires**: API key (free tier: 100 req/day)

**Response:**

```json
{
  "items": [
    {
      "float_value": 0.25432,
      "paint_seed": 123,
      "stickers": [],
      ...
    }
  ]
}
```

## Steam OpenID (Login)

### Initiate Login

```
GET https://steamcommunity.com/openid/login
```

**Parameters:**

-   `openid.mode`: checkid_setup
-   `openid.return_to`: Your callback URL
-   `openid.realm`: Your domain
-   `openid.identity`: http://specs.openid.net/auth/2.0/identifier_select

**Process:**

1. Redirect user to Steam login
2. Steam redirects back with `openid.claimed_id`
3. Extract Steam ID from claimed_id
4. Verify signature

## Useful Resources

### CS2 Skin Databases

-   **CSGOBackpack**: https://github.com/SteamDatabase/GameTracking-CS2
-   **CS2 Items**: Various JSON databases on GitHub
-   **Steam Item Schema**: https://api.steampowered.com/IEconItems_730/GetSchema/v2/

### CORS Proxies

-   **AllOrigins**: https://api.allorigins.win/raw?url=
-   **CORS Anywhere**: https://cors-anywhere.herokuapp.com/
-   **Your Own**: Recommended for production

### Price Comparison Sites

-   **Skinport**: https://skinport.com/
-   **CSGOFloat Market**: https://csgofloat.com/
-   **Buff163**: https://buff.163.com/ (China)
-   **DMarket**: https://dmarket.com/

## Rate Limiting Best Practices

```typescript
// Debounce requests
const debouncedFetch = debounce(fetchPrice, 1000);

// Batch requests
const allPrices = await getBatchPrices(marketHashNames);

// Cache aggressively
const { data } = useGetSkinportPricesQuery(undefined, {
	refetchOnMountOrArgChange: 300, // 5 minutes
});

// Implement retry logic
const fetchWithRetry = async (url, retries = 3) => {
	try {
		return await fetch(url);
	} catch (error) {
		if (retries > 0) {
			await sleep(1000);
			return fetchWithRetry(url, retries - 1);
		}
		throw error;
	}
};
```

## Error Handling

```typescript
// Steam inventory errors
if (!data.success) {
	// Profile is private
	throw new Error("Profile is private or Steam ID invalid");
}

// Price API errors
if (!response.ok) {
	if (response.status === 429) {
		// Rate limited
		await sleep(60000); // Wait 1 minute
		return retry();
	}
	throw new Error("Failed to fetch prices");
}

// Network errors
try {
	const result = await fetch(url);
} catch (error) {
	if (error.name === "TypeError") {
		// Network error or CORS issue
		throw new Error("Network error. Try using proxy.");
	}
}
```

## Implementation Notes

### Current Implementation

-   ✅ Skinport API (direct, no proxy needed)
-   ✅ Steam Inventory (via AllOrigins proxy)
-   ✅ 5-minute price caching
-   ✅ 10-minute inventory caching

### Production Recommendations

1. **Implement backend proxy** for Steam APIs
2. **Add Redis cache** for prices (1-hour TTL)
3. **Use job queue** for background price updates
4. **Implement rate limiting** on your endpoints
5. **Add Steam OpenID** for secure login
6. **Store user preferences** (DB or localStorage)

### Example Backend Proxy (Node.js)

```javascript
// server.js
app.get("/api/steam/inventory/:steamId", async (req, res) => {
	try {
		const url = `https://steamcommunity.com/inventory/${req.params.steamId}/730/2`;
		const response = await fetch(url);
		const data = await response.json();
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get("/api/steam/price/:itemName", async (req, res) => {
	// Check cache first
	const cached = await redis.get(`price:${req.params.itemName}`);
	if (cached) return res.json(JSON.parse(cached));

	// Fetch from Steam
	const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${req.params.itemName}`;
	const response = await fetch(url);
	const data = await response.json();

	// Cache for 5 minutes
	await redis.setex(
		`price:${req.params.itemName}`,
		300,
		JSON.stringify(data)
	);

	res.json(data);
});
```
