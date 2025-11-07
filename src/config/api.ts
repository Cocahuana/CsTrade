// API Configuration
export const API_CONFIG = {
	// Backend API Server (our Express.js server)
	backend: {
		baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
		steam: {
			inventory: (steamId: string) => `/steam/inventory/${steamId}`,
			marketPrice: (marketHashName: string) =>
				`/steam/market/price/${encodeURIComponent(marketHashName)}`,
			userProfile: (steamId: string) => `/steam/user/${steamId}`,
		},
	},

	// Direct Steam APIs (fallback - not recommended due to CORS)
	steam: {
		inventoryUrl: (steamId: string) =>
			`https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=75`,
		marketPriceUrl: (marketHashName: string) =>
			`https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(
				marketHashName
			)}`,
	},

	// Skinport API (Free tier)
	skinport: {
		baseUrl: "https://api.skinport.com/v1",
		itemsUrl: () => "https://api.skinport.com/v1/items",
		currency: "USD",
	},

	// CSGOFloat API
	csgoFloat: {
		baseUrl: "https://csgofloat.com/api/v1",
		// Requires API key for higher limits
	},

	// CORS Proxy options
	corsProxy: {
		// Option 1: AllOrigins (most reliable)
		allOrigins: (url: string) =>
			`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,

		// Option 2: CORS Anywhere (backup)
		corsAnywhere: (url: string) =>
			`https://cors-anywhere.herokuapp.com/${url}`,

		// Option 3: ThingProxy (backup)
		thingProxy: (url: string) =>
			`https://thingproxy.freeboard.io/fetch/${url}`,

		// Option 4: Your own backend proxy (recommended for production)
		// custom: (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`,
	},
};

// CS2 App ID
export const CS2_APP_ID = 730;

// Steam inventory context
export const STEAM_CONTEXT = {
	appId: CS2_APP_ID,
	contextId: "2", // Community items
};

// Rate limiting
export const RATE_LIMITS = {
	steam: {
		requestsPerSecond: 1, // Steam is strict
		retryAfter: 60000, // 1 minute
	},
	skinport: {
		requestsPerSecond: 10,
	},
};
