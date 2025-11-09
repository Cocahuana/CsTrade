import express from "express";
import fetch from "node-fetch";
import db from "../models/index.js";

const router = express.Router();
const { Price } = db;

// Cache expiration time in minutes (from env or default 60min)
const CACHE_EXPIRATION_MINUTES =
	parseInt(process.env.PRICE_CACHE_MINUTES) || 60;

/**
 * GET /api/prices/:marketHashName
 * Get price with database caching
 * 
 * 1. Check DB cache first
 * 2. If expired or not found, fetch from Steam
 * 3. Update DB cache
 * 4. Return price
 */
router.get("/:marketHashName", async (req, res, next) => {
	try {
		const { marketHashName } = req.params;

		console.log(`💰 Price request for: ${marketHashName}`);

		// 1. Try to get from cache
		let priceRecord = await Price.findOne({
			where: { marketHashName },
		});

		// 2. Check if cache is valid
		if (priceRecord && !priceRecord.needsUpdate(CACHE_EXPIRATION_MINUTES)) {
			console.log(`  ✅ Cache HIT (age: ${Math.floor((Date.now() - new Date(priceRecord.updatedAt)) / 1000 / 60)}min)`);
			return res.json({
				success: true,
				data: {
					marketHashName: priceRecord.marketHashName,
					price: parseFloat(priceRecord.price),
					lowestPrice: priceRecord.lowestPrice
						? parseFloat(priceRecord.lowestPrice)
						: null,
					medianPrice: priceRecord.medianPrice
						? parseFloat(priceRecord.medianPrice)
						: null,
					volume: priceRecord.volume,
					source: priceRecord.source,
					timestamp: priceRecord.updatedAt,
					cached: true,
				},
			});
		}

		console.log(`  ⚠️ Cache MISS or expired - fetching from Steam...`);

		// 3. Fetch from Steam Market
		const appId = 730;
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

		if (!response.ok) {
			throw new Error(`Steam API returned ${response.status}`);
		}

		const data = await response.json();

		// Parse prices
		const lowestPrice = data.lowest_price
			? parseFloat(data.lowest_price.replace(/[$,]/g, ""))
			: null;
		const medianPrice = data.median_price
			? parseFloat(data.median_price.replace(/[$,]/g, ""))
			: null;
		const price = lowestPrice || medianPrice || 0;

		// 4. Update or create cache
		if (priceRecord) {
			await priceRecord.update({
				price,
				lowestPrice,
				medianPrice,
				volume: data.volume || 0,
				source: "steam",
			});
			console.log(`  ✅ Cache UPDATED`);
		} else {
			priceRecord = await Price.create({
				marketHashName,
				price,
				lowestPrice,
				medianPrice,
				volume: data.volume || 0,
				source: "steam",
			});
			console.log(`  ✅ Cache CREATED`);
		}

		res.json({
			success: true,
			data: {
				marketHashName,
				price,
				lowestPrice,
				medianPrice,
				volume: data.volume || 0,
				source: "steam",
				timestamp: Date.now(),
				cached: false,
			},
		});
	} catch (error) {
		console.error(`❌ Error fetching price:`, error.message);
		next(error);
	}
});

/**
 * POST /api/prices/batch
 * Batch price fetching with intelligent caching
 * 
 * Returns cached prices immediately and fetches missing/expired ones
 */
router.post("/batch", async (req, res, next) => {
	try {
		const { marketHashNames } = req.body;

		if (!Array.isArray(marketHashNames) || marketHashNames.length === 0) {
			return res.status(400).json({
				success: false,
				error: "marketHashNames must be a non-empty array",
			});
		}

		console.log(`💰 Batch price request for ${marketHashNames.length} items`);

		// 1. Get all from cache
		const cachedPrices = await Price.findAll({
			where: {
				marketHashName: marketHashNames,
			},
		});

		const priceMap = {};
		const needsFetch = [];

		// 2. Separate valid cache from expired/missing
		for (const marketHashName of marketHashNames) {
			const cached = cachedPrices.find(
				(p) => p.marketHashName === marketHashName
			);

			if (cached && !cached.needsUpdate(CACHE_EXPIRATION_MINUTES)) {
				// Valid cache
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
					cached: true,
				};
			} else {
				needsFetch.push(marketHashName);
			}
		}

		console.log(`  ✅ ${Object.keys(priceMap).length} from cache`);
		console.log(`  ⚠️ ${needsFetch.length} need fetching`);

		// 3. Fetch missing/expired prices
		const errors = [];

		for (let i = 0; i < needsFetch.length; i++) {
			const marketHashName = needsFetch[i];

			try {
				const appId = 730;
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

					// Update or create
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
						cached: false,
					};

					console.log(`  ✅ [${i + 1}/${needsFetch.length}] ${marketHashName}: $${price}`);
				} else {
					console.warn(`  ⚠️ Failed: ${marketHashName}`);
					errors.push({ marketHashName, error: `HTTP ${response.status}` });
				}

				// Rate limiting
				if (i < needsFetch.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 1500));
				}
			} catch (error) {
				console.error(`  ❌ Error: ${marketHashName}:`, error.message);
				errors.push({ marketHashName, error: error.message });
			}
		}

		res.json({
			success: true,
			data: priceMap,
			errors: errors.length > 0 ? errors : undefined,
			stats: {
				requested: marketHashNames.length,
				fetched: Object.keys(priceMap).length,
				fromCache: Object.keys(priceMap).length - needsFetch.length + errors.length,
				fromSteam: needsFetch.length - errors.length,
				failed: errors.length,
			},
		});
	} catch (error) {
		console.error("❌ Error in batch price fetch:", error.message);
		next(error);
	}
});

/**
 * DELETE /api/prices/cache
 * Clear price cache (admin/development only)
 */
router.delete("/cache", async (req, res, next) => {
	try {
		const { olderThan } = req.query;

		let deleted;
		if (olderThan) {
			const date = new Date(Date.now() - parseInt(olderThan) * 60 * 1000);
			deleted = await Price.destroy({
				where: {
					updatedAt: {
						[db.Sequelize.Op.lt]: date,
					},
				},
			});
		} else {
			deleted = await Price.destroy({ where: {}, truncate: true });
		}

		console.log(`🗑️ Deleted ${deleted} price records from cache`);

		res.json({
			success: true,
			message: `Cleared ${deleted} price records`,
		});
	} catch (error) {
		console.error("❌ Error clearing cache:", error.message);
		next(error);
	}
});

export default router;

