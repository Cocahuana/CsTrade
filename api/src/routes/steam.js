import express from "express";
import fetch from "node-fetch";

const router = express.Router();

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
				const steamUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?xml=1`;

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
				const steamUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}`;

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

		console.log(
			`✅ Successfully fetched inventory: ${
				data.total_inventory_count || data.assets?.length || 0
			} total items`
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

export default router;
