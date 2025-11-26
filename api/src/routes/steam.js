import express from "express";
import fetch from "node-fetch";
import db from "../models/index.js";
import {
	getAllCS2Items,
	getItemsByCollection,
	searchItems,
} from "../data/cs2Items.js";
import {
	getPossibleOutcomes,
	getItemsByCollectionAndRarity,
	COLLECTION_ITEMS,
} from "../data/collectionItems.js";

const router = express.Router();
const { Price } = db;
const CACHE_EXPIRATION_MINUTES =
	parseInt(process.env.PRICE_CACHE_MINUTES) || 60;

/**
 * GET /api/steam/inventory/:steamId
 * Fetches a user's CS2 inventory from Steam
 *
 * @param {string} steamId - The Steam ID (64-bit)
 * @returns {Object} Steam inventory data
 */
router.get("/inventory/:steamId", async (req, res, next) => {
	try {
		const { steamId } = req.params;

		// Validate Steam ID (should be 17 digits)
		if (!/^\d{17}$/.test(steamId)) {
			return res.status(400).json({
				success: false,
				error: "Invalid Steam ID format. Should be 17 digits.",
			});
		}

		const appId = 730; // CS2
		const contextId = 2; // Community items

		// Try multiple methods to fetch inventory
		let data = null;
		let lastError = null;

		// Method 1: Try official Steam Web API endpoint (if API key is available)
		if (process.env.STEAM_API_KEY) {
			try {
				console.log(
					`📦 Method 1: Trying Steam Web API with API key...`
				);
				const webApiUrl = `https://api.steampowered.com/IEconItems_${appId}/GetPlayerItems/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}`;

				const webApiResponse = await fetch(webApiUrl);

				if (webApiResponse.ok) {
					const webApiData = await webApiResponse.json();
					if (webApiData.result && webApiData.result.items) {
						console.log(
							`✅ Successfully fetched via Steam Web API`
						);
						// Convert Web API format to inventory format
						data = {
							success: 1,
							assets: webApiData.result.items.map((item) => ({
								assetid: item.id,
								classid: item.classid,
								instanceid: item.instanceid,
								amount: "1",
							})),
							descriptions: webApiData.result.items.map(
								(item) => ({
									classid: item.classid,
									instanceid: item.instanceid,
									name: item.name || "Unknown",
									market_hash_name:
										item.market_hash_name || item.name,
									type: item.type,
									tradable: 1,
									marketable: 1,
								})
							),
							total_inventory_count:
								webApiData.result.num_backpack_slots,
						};
					}
				}
			} catch (e) {
				console.warn(`⚠️ Steam Web API failed:`, e.message);
				lastError = e;
			}
		}

		// Method 2: Try community inventory with XML parameter (more reliable per Steam docs)
		if (!data) {
			try {
				console.log(
					`📦 Method 2: Trying community inventory with XML parameter...`
				);
				const steamUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?xml=1&l=english`;

				const response = await fetch(steamUrl, {
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					},
				});

				console.log(`📡 Response status: ${response.status}`);

				if (response.ok) {
					const contentType = response.headers.get("content-type");
					console.log(`📡 Content-Type: ${contentType}`);

					// Try to parse as JSON (Steam sometimes returns JSON even with xml=1)
					const responseText = await response.text();
					try {
						const responseData = JSON.parse(responseText);
						if (
							responseData &&
							(responseData.success === 1 || responseData.assets)
						) {
							console.log(
								`✅ Successfully fetched via XML endpoint (returned JSON)`
							);
							data = responseData;
						}
					} catch (parseErr) {
						console.warn(
							`⚠️ Could not parse as JSON:`,
							responseText.substring(0, 200)
						);
					}
				} else {
					const errorBody = await response.text();
					console.error(
						`❌ XML endpoint returned ${response.status}:`,
						errorBody?.substring(0, 200)
					);
					lastError = new Error(
						`HTTP ${response.status}: ${
							errorBody || response.statusText
						}`
					);
				}
			} catch (e) {
				console.warn(`⚠️ XML endpoint failed:`, e.message);
				lastError = e;
			}
		}

		// Method 3: Try standard JSON endpoint (fallback)
		if (!data) {
			try {
				console.log(`📦 Method 3: Trying standard JSON endpoint...`);
				const steamUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?l=english`;

				const response = await fetch(steamUrl, {
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
						Accept: "application/json",
					},
				});

				console.log(`📡 Response status: ${response.status}`);

				if (response.ok) {
					const responseData = await response.json();
					if (
						responseData &&
						(responseData.success === 1 || responseData.assets)
					) {
						console.log(
							`✅ Successfully fetched via standard endpoint`
						);
						data = responseData;
					}
				} else {
					const errorBody = await response.text();
					console.error(
						`❌ Standard endpoint returned ${response.status}:`,
						errorBody?.substring(0, 200)
					);
					lastError = new Error(
						`HTTP ${response.status}: ${
							errorBody || response.statusText
						}`
					);
				}
			} catch (e) {
				console.warn(`⚠️ Standard endpoint failed:`, e.message);
				lastError = e;
			}
		}

		// If all methods failed
		if (!data) {
			console.error(
				`❌ All methods failed. Last error:`,
				lastError?.message
			);
			return res.status(500).json({
				success: false,
				error: `Failed to fetch inventory. This might be because: 1) Your inventory is private, 2) Steam is rate-limiting requests, or 3) You don't have CS2 items. Error: ${
					lastError?.message || "Unknown"
				}`,
			});
		}

		// Validate data
		if (!data.assets || data.assets.length === 0) {
			return res.status(404).json({
				success: false,
				error: "No CS2 items found in inventory.",
			});
		}

		// Check for protected items in the raw data
		const protectedItems =
			data.descriptions?.filter(
				(desc) => desc.fraudwarnings && desc.fraudwarnings.length > 0
			) || [];

		const tradableItems =
			data.descriptions?.filter((desc) => desc.tradable === 1) || [];

		console.log(
			`✅ Successfully fetched inventory: ${
				data.total_inventory_count || data.assets?.length || 0
			} total items | ${tradableItems.length} tradable | ${
				protectedItems.length
			} protected`
		);

		// Return the data as-is (frontend will process it)
		res.json({
			success: true,
			data: data,
		});
	} catch (error) {
		console.error("❌ Error fetching inventory:", error.message);
		next(error);
	}
});

/**
 * GET /api/steam/market/price/:marketHashName
 * Fetches market price for a specific item from Steam
 *
 * @param {string} marketHashName - The market hash name of the item
 * @returns {Object} Price data
 */
router.get("/market/price/:marketHashName", async (req, res, next) => {
	try {
		const { marketHashName } = req.params;
		const appId = 730; // CS2

		const steamUrl = `https://steamcommunity.com/market/priceoverview/?appid=${appId}&currency=1&market_hash_name=${encodeURIComponent(
			marketHashName
		)}`;

		console.log(`💰 Fetching price for: ${marketHashName}`);

		const response = await fetch(steamUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			console.error(`❌ Steam Market API returned ${response.status}`);
			return res.status(response.status).json({
				success: false,
				error: "Failed to fetch market price",
			});
		}

		const data = await response.json();

		console.log(`✅ Price fetched: ${data.lowest_price || "N/A"}`);

		res.json({
			success: true,
			data: data,
		});
	} catch (error) {
		console.error("❌ Error fetching market price:", error.message);
		next(error);
	}
});

/**
 * POST /api/steam/market/prices/batch
 * Fetches market prices for multiple items from Steam
 * Now uses database caching for improved performance
 *
 * @body {Array<string>} marketHashNames - Array of market hash names
 * @returns {Object} Object with prices keyed by market hash name
 */
router.post("/market/prices/batch", async (req, res, next) => {
	// NOTE: This endpoint now delegates to /api/prices/batch
	// which handles database caching automatically
	// We keep this endpoint for backward compatibility
	try {
		const { marketHashNames } = req.body;

		if (!Array.isArray(marketHashNames) || marketHashNames.length === 0) {
			return res.status(400).json({
				success: false,
				error: "marketHashNames must be a non-empty array",
			});
		}

		if (marketHashNames.length > 100) {
			return res.status(400).json({
				success: false,
				error: "Batch size limited to 100 items",
			});
		}

		console.log(
			`💰 Batch fetching prices for ${marketHashNames.length} items (with DB cache)...`
		);

		// 1. Get from cache
		const cachedPrices = await Price.findAll({
			where: {
				marketHashName: marketHashNames,
			},
		});

		const priceMap = {};
		const needsFetch = [];

		// 2. Check cache validity
		for (const marketHashName of marketHashNames) {
			const cached = cachedPrices.find(
				(p) => p.marketHashName === marketHashName
			);

			if (cached && !cached.needsUpdate(CACHE_EXPIRATION_MINUTES)) {
				priceMap[marketHashName] = {
					marketHashName: cached.marketHashName,
					price: parseFloat(cached.price),
					lowestPrice: cached.lowestPrice
						? parseFloat(cached.lowestPrice)
						: null,
					medianPrice: cached.medianPrice
						? parseFloat(cached.medianPrice)
						: null,
					volume: cached.volume,
					source: cached.source,
					timestamp: cached.updatedAt.getTime(),
				};
			} else {
				needsFetch.push(marketHashName);
			}
		}

		console.log(`  ✅ ${Object.keys(priceMap).length} from cache`);
		console.log(`  ⚠️ ${needsFetch.length} need fetching from Steam`);

		// 3. Fetch missing/expired
		const errors = [];
		const appId = 730;

		for (let i = 0; i < needsFetch.length; i++) {
			const marketHashName = needsFetch[i];

			try {
				const steamUrl = `https://steamcommunity.com/market/priceoverview/?appid=${appId}&currency=1&market_hash_name=${encodeURIComponent(
					marketHashName
				)}`;

				const response = await fetch(steamUrl, {
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
						Accept: "application/json",
					},
				});

				if (response.ok) {
					const data = await response.json();

					const lowestPrice = data.lowest_price
						? parseFloat(data.lowest_price.replace(/[$,]/g, ""))
						: null;
					const medianPrice = data.median_price
						? parseFloat(data.median_price.replace(/[$,]/g, ""))
						: null;
					const price = lowestPrice || medianPrice || 0;

					// Update or create in DB
					await Price.upsert({
						marketHashName,
						price,
						lowestPrice,
						medianPrice,
						volume: data.volume || 0,
						source: "steam",
					});

					priceMap[marketHashName] = {
						marketHashName,
						price,
						lowestPrice,
						medianPrice,
						volume: data.volume || 0,
						source: "steam",
						timestamp: Date.now(),
					};

					console.log(
						`  ✅ [${i + 1}/${
							needsFetch.length
						}] ${marketHashName}: $${price}`
					);
				} else {
					console.warn(
						`  ⚠️ Failed: ${marketHashName} (${response.status})`
					);
					errors.push({
						marketHashName,
						error: `HTTP ${response.status}`,
					});
				}

				// Rate limiting
				if (i < needsFetch.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 1500));
				}
			} catch (error) {
				console.error(`  ❌ Error: ${marketHashName}:`, error.message);
				errors.push({
					marketHashName,
					error: error.message,
				});
			}
		}

		console.log(
			`✅ Batch complete: ${Object.keys(priceMap).length} total (${
				cachedPrices.length - needsFetch.length + errors.length
			} cached, ${needsFetch.length - errors.length} fetched, ${
				errors.length
			} failed)`
		);

		res.json({
			success: true,
			data: priceMap,
			errors: errors.length > 0 ? errors : undefined,
			stats: {
				requested: marketHashNames.length,
				fetched: Object.keys(priceMap).length,
				failed: errors.length,
			},
		});
	} catch (error) {
		console.error("❌ Error in batch price fetch:", error.message);
		next(error);
	}
});

/**
 * GET /api/steam/user/:steamId
 * Fetches user profile information (requires Steam Web API key)
 *
 * @param {string} steamId - The Steam ID (64-bit)
 * @returns {Object} User profile data
 */
router.get("/user/:steamId", async (req, res, next) => {
	try {
		const { steamId } = req.params;
		const apiKey = process.env.STEAM_API_KEY;

		if (!apiKey) {
			return res.status(500).json({
				success: false,
				error: "Steam API key not configured on server",
			});
		}

		const steamUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;

		console.log(`👤 Fetching user profile for: ${steamId}`);

		const response = await fetch(steamUrl);

		if (!response.ok) {
			return res.status(response.status).json({
				success: false,
				error: "Failed to fetch user profile",
			});
		}

		const data = await response.json();

		res.json({
			success: true,
			data: data.response.players[0] || null,
		});
	} catch (error) {
		console.error("❌ Error fetching user profile:", error.message);
		next(error);
	}
});

/**
 * GET /api/steam/items/all
 * Gets all CS2 items metadata (collections, rarities, weapon types, etc.)
 * This data is cached and doesn't require external API calls
 *
 * @returns {Object} CS2 items metadata
 */
router.get("/items/all", (req, res, next) => {
	try {
		console.log(`🎮 Fetching all CS2 items metadata...`);

		const items = getAllCS2Items();

		console.log(`✅ CS2 items metadata fetched successfully`);

		res.json({
			success: true,
			data: items,
		});
	} catch (error) {
		console.error("❌ Error fetching CS2 items:", error.message);
		next(error);
	}
});

/**
 * GET /api/steam/items/collection/:collectionName
 * Gets items from a specific collection
 *
 * @param {string} collectionName - The collection name
 * @returns {Object} Collection items
 */
router.get("/items/collection/:collectionName", (req, res, next) => {
	try {
		const { collectionName } = req.params;

		console.log(`🎮 Fetching items from collection: ${collectionName}`);

		const items = getItemsByCollection(collectionName);

		res.json({
			success: true,
			data: items,
		});
	} catch (error) {
		console.error("❌ Error fetching collection items:", error.message);
		next(error);
	}
});

/**
 * GET /api/steam/items/search?q=query
 * Searches for items by name
 *
 * @query {string} q - Search query
 * @returns {Object} Search results
 */
router.get("/items/search", (req, res, next) => {
	try {
		const { q } = req.query;

		if (!q) {
			return res.status(400).json({
				success: false,
				error: "Search query (q) is required",
			});
		}

		console.log(`🔍 Searching items: ${q}`);

		const results = searchItems(q);

		res.json({
			success: true,
			data: results,
		});
	} catch (error) {
		console.error("❌ Error searching items:", error.message);
		next(error);
	}
});

/**
 * GET /api/steam/items/collection-items
 * Gets all collection items database
 *
 * @returns {Object} All collection items
 */
router.get("/items/collection-items", (req, res, next) => {
	try {
		console.log(`📚 Fetching collection items database...`);

		res.json({
			success: true,
			data: COLLECTION_ITEMS,
		});
	} catch (error) {
		console.error("❌ Error fetching collection items:", error.message);
		next(error);
	}
});

/**
 * POST /api/steam/floats
 * Fetch float values for items using inspect links
 *
 * NOTE: This requires integration with CSGOFloat API or similar service
 * For now, this is a placeholder that returns mock data
 *
 * @body {Array<Object>} items - Array of items with inspect links
 * @returns {Object} Float values keyed by asset ID
 */
router.post("/floats", async (req, res, next) => {
	try {
		const { items } = req.body;

		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				success: false,
				error: "items must be a non-empty array",
			});
		}

		console.log(`🔢 Fetching float values for ${items.length} items...`);

		// TODO: Integrate with CSGOFloat API or similar service
		// Example: https://csgofloat.com/api/v1/
		//
		// For now, return placeholder data
		const floatData = {};

		items.forEach((item) => {
			// Generate a random float value for demonstration
			// In production, this would fetch from CSGOFloat API using inspect link
			floatData[item.assetId] = {
				assetId: item.assetId,
				floatValue: Math.random(),
				paintseed: Math.floor(Math.random() * 1000),
				paintindex: Math.floor(Math.random() * 100),
				// Add more data as needed
			};
		});

		console.log(`✅ Float values fetched (mock data for now)`);

		res.json({
			success: true,
			data: floatData,
			note: "Float values are currently mock data. Integrate CSGOFloat API for real values.",
		});
	} catch (error) {
		console.error("❌ Error fetching floats:", error.message);
		next(error);
	}
});

/**
 * POST /api/steam/items/outcomes
 * Calculate possible trade-up outcomes for given inputs
 *
 * @body {Array<Object>} inputs - Array of input items with collection and rarity
 * @returns {Object} Possible outcome items
 */
router.post("/items/outcomes", (req, res, next) => {
	try {
		const { inputs } = req.body;

		if (!Array.isArray(inputs) || inputs.length === 0) {
			return res.status(400).json({
				success: false,
				error: "inputs must be a non-empty array",
			});
		}

		console.log(
			`🎲 Calculating outcomes for ${inputs.length} input items...`
		);

		// Group inputs by collection
		const collectionCounts = {};
		const inputRarity = inputs[0].rarity;

		inputs.forEach((item) => {
			const collection = item.collection || "Unknown";
			if (!collectionCounts[collection]) {
				collectionCounts[collection] = 0;
			}
			collectionCounts[collection]++;
		});

		// Get possible outcomes for each collection
		const allOutcomes = [];
		const outcomesByCollection = {};

		Object.entries(collectionCounts).forEach(([collection, count]) => {
			const possibleItems = getPossibleOutcomes(collection, inputRarity);

			if (possibleItems.length > 0) {
				const probability = count / inputs.length;

				possibleItems.forEach((itemName) => {
					allOutcomes.push({
						name: itemName,
						collection,
						probability,
						baseItem: itemName,
					});
				});

				outcomesByCollection[collection] = {
					items: possibleItems,
					count,
					probability,
				};
			}
		});

		console.log(
			`✅ Found ${allOutcomes.length} possible outcomes across ${
				Object.keys(outcomesByCollection).length
			} collections`
		);

		res.json({
			success: true,
			data: {
				outcomes: allOutcomes,
				byCollection: outcomesByCollection,
				stats: {
					totalOutcomes: allOutcomes.length,
					collectionsInvolved:
						Object.keys(outcomesByCollection).length,
					inputRarity,
				},
			},
		});
	} catch (error) {
		console.error("❌ Error calculating outcomes:", error.message);
		next(error);
	}
});

export default router;
