import fetch from "node-fetch";
import db from "../models/index.js";

const { Item, Price } = db;

// Steam API configuration
const STEAM_APP_ID = 730; // CS2/CSGO
const STEAM_CURRENCY = 1; // USD
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds to avoid rate limiting
const MAX_RETRIES = 3;
const RETRY_DELAY = 8000; // 8 seconds

// CS2 wear conditions (ordered cheapest to most expensive typically)
const WEAR_CONDITIONS = [
	"Battle-Scarred",
	"Well-Worn",
	"Field-Tested",
	"Minimal Wear",
	"Factory New",
];

/**
 * Extract exterior/wear condition from item name
 */
function extractExterior(itemName) {
	const exteriorMatch = itemName.match(
		/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/
	);
	if (exteriorMatch) {
		return exteriorMatch[1];
	}

	// Check for vanilla/not painted items
	if (
		itemName.includes("Vanilla") ||
		(!itemName.includes("|") && !itemName.includes("("))
	) {
		return "Vanilla";
	}

	return null;
}

/**
 * Fetch image URL from Steam Market
 */
async function fetchSteamImageUrl(marketHashName) {
	try {
		const url = `https://steamcommunity.com/market/listings/${STEAM_APP_ID}/${encodeURIComponent(
			marketHashName
		)}`;
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		});

		if (!response.ok) return null;

		const html = await response.text();
		// Extract image URL from market listing page
		const imageMatch = html.match(
			/"(https:\/\/community\.cloudflare\.steamstatic\.com\/economy\/image\/[^"]+)"/
		);

		return imageMatch ? imageMatch[1] : null;
	} catch (error) {
		console.log(`  ⚠️ Could not fetch image for ${marketHashName}`);
		return null;
	}
}

/**
 * Try to fetch price for item with different wear conditions
 */
async function fetchItemWithWear(itemName, retryCount = 0) {
	// Try each wear condition
	for (const wear of WEAR_CONDITIONS) {
		const fullName = `${itemName} (${wear})`;
		const priceData = await fetchSteamPrice(fullName, retryCount);

		if (priceData) {
			return {
				...priceData,
				variant: fullName,
			};
		}
	}

	// If no wear condition works, try without it (for stickers, etc.)
	return fetchSteamPrice(itemName, retryCount);
}

/**
 * Fetch price for a single item from Steam Market
 */
async function fetchSteamPrice(marketHashName, retryCount = 0) {
	const url = `https://steamcommunity.com/market/priceoverview/?appid=${STEAM_APP_ID}&currency=${STEAM_CURRENCY}&market_hash_name=${encodeURIComponent(
		marketHashName
	)}`;

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			// Handle rate limiting
			if (response.status === 429 && retryCount < MAX_RETRIES) {
				console.log(
					`  ⚠️ Rate limited, retrying in ${
						RETRY_DELAY / 1000
					}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`
				);
				await new Promise((resolve) =>
					setTimeout(resolve, RETRY_DELAY)
				);
				return fetchSteamPrice(marketHashName, retryCount + 1);
			}
			throw new Error(`Steam API returned ${response.status}`);
		}

		const data = await response.json();

		// Check if item exists on market
		if (!data.success || !data.lowest_price) {
			return null; // Item not available on market
		}

		// Parse prices (remove currency symbols and convert to number)
		const lowestPrice = data.lowest_price
			? parseFloat(data.lowest_price.replace(/[$,]/g, ""))
			: null;
		const medianPrice = data.median_price
			? parseFloat(data.median_price.replace(/[$,]/g, ""))
			: null;

		// Use median as main price, fallback to lowest
		const price = medianPrice || lowestPrice || 0;

		return {
			lowestPrice,
			medianPrice,
			price,
			volume: parseInt(data.volume?.replace(/,/g, "") || "0"),
		};
	} catch (error) {
		if (retryCount < MAX_RETRIES) {
			console.log(
				`  ⚠️ Error: ${error.message}, retrying... (attempt ${
					retryCount + 1
				}/${MAX_RETRIES})`
			);
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
			return fetchSteamPrice(marketHashName, retryCount + 1);
		}
		throw error;
	}
}

/**
 * Fetch prices for all collection items
 * @param {Object} options - Fetch options
 * @param {boolean} options.skipGraffiti - Skip graffiti items (default: true)
 * @param {boolean} options.updateExisting - Update existing price records (default: false)
 * @param {number} options.limit - Limit number of items to process (for testing)
 */
export async function fetchAllItemPrices(options = {}) {
	const {
		skipGraffiti = true,
		updateExisting = false,
		limit = null,
	} = options;

	const startTime = Date.now();
	const stats = {
		total: 0,
		processed: 0,
		success: 0,
		failed: 0,
		skipped: 0,
		notAvailable: 0,
		errors: [],
	};

	try {
		console.log("🔄 Starting price fetch for all collection items...");

		// Get all items from database
		let items = await Item.findAll({
			attributes: ["id", "name"],
			order: [["name", "ASC"]],
		});

		stats.total = items.length;
		console.log(`📊 Found ${stats.total} items in database\n`);

		// Filter out graffiti if requested
		if (skipGraffiti) {
			items = items.filter(
				(item) =>
					!item.name.toLowerCase().includes("graffiti") &&
					!item.name.toLowerCase().includes("spray")
			);
			console.log(
				`📊 After filtering graffiti: ${items.length} items remaining\n`
			);
		}

		// Apply limit if specified
		if (limit) {
			items = items.slice(0, limit);
			console.log(`📊 Limited to ${limit} items for testing\n`);
		}

		// Get existing price records if not updating
		let existingPrices = new Set();
		if (!updateExisting) {
			const prices = await Price.findAll({
				attributes: ["marketHashName"],
			});
			existingPrices = new Set(prices.map((p) => p.marketHashName));
			console.log(
				`📊 Found ${existingPrices.size} existing price records (will skip)\n`
			);
		}

		// Process each item
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const progress = `[${i + 1}/${items.length}]`;

			// Skip if already exists and not updating
			if (!updateExisting && existingPrices.has(item.name)) {
				console.log(
					`${progress} ⏭️  Skipping (already exists): ${item.name}`
				);
				stats.skipped++;
				continue;
			}

			console.log(`${progress} 📥 Fetching: ${item.name}`);
			stats.processed++;

			try {
				// Try to fetch price with different wear conditions
				const priceData = await fetchItemWithWear(item.name);

				if (!priceData) {
					console.log(`${progress}   ⚠️  Not found on market`);
					stats.notAvailable++;

					// Still create record with zero prices
					const exterior = extractExterior(item.name);
					await Price.upsert({
						marketHashName: item.name,
						exterior,
						price: 0,
						lowestPrice: null,
						medianPrice: null,
						volume: 0,
						source: "steam",
					});
				} else {
					// Extract exterior from the item name used
					const itemNameUsed = priceData.variant || item.name;
					const exterior = extractExterior(itemNameUsed);

					// Fetch image URL from Steam (with delay to avoid rate limiting)
					const imageUrl = await fetchSteamImageUrl(itemNameUsed);

					// Save/update price in database
					await Price.upsert({
						marketHashName: item.name,
						exterior,
						price: priceData.price,
						lowestPrice: priceData.lowestPrice,
						medianPrice: priceData.medianPrice,
						volume: priceData.volume,
						source: "steam",
					});

					// Update Item with imageUrl and exterior
					await Item.update(
						{
							imageUrl,
							exterior,
						},
						{
							where: { id: item.id },
						}
					);

					const variantInfo = priceData.variant
						? ` [${priceData.variant}]`
						: "";
					const imageInfo = imageUrl ? " 🖼️" : "";
					console.log(
						`${progress}   ✅ $${priceData.price.toFixed(
							2
						)} (Low: $${
							priceData.lowestPrice?.toFixed(2) || "N/A"
						}, Med: $${
							priceData.medianPrice?.toFixed(2) || "N/A"
						}${variantInfo})${imageInfo}`
					);
					stats.success++;
				}
			} catch (error) {
				console.log(`${progress}   ❌ Error: ${error.message}`);
				stats.failed++;
				stats.errors.push({
					item: item.name,
					error: error.message,
				});
			}

			// Delay between requests to avoid rate limiting
			if (i < items.length - 1) {
				await new Promise((resolve) =>
					setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
				);
			}
		}

		const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

		console.log("\n" + "═".repeat(60));
		console.log("PRICE FETCH COMPLETE");
		console.log("═".repeat(60));
		console.log(`Total items in DB: ${stats.total}`);
		console.log(`Processed: ${stats.processed}`);
		console.log(`Success: ${stats.success}`);
		console.log(`Not available: ${stats.notAvailable}`);
		console.log(`Failed: ${stats.failed}`);
		console.log(`Skipped (existing): ${stats.skipped}`);
		console.log(`Duration: ${duration} minutes`);
		console.log("═".repeat(60));

		if (stats.errors.length > 0 && stats.errors.length <= 10) {
			console.log("\nErrors:");
			stats.errors.forEach((err) => {
				console.log(`  - ${err.item}: ${err.error}`);
			});
		}

		return {
			success: true,
			stats: {
				...stats,
				duration: `${duration}m`,
			},
		};
	} catch (error) {
		console.error("❌ Fatal error during price fetch:", error);
		return {
			success: false,
			error: error.message,
			stats,
		};
	}
}

/**
 * Update prices for specific items
 */
export async function updateItemPrices(itemNames) {
	const stats = {
		total: itemNames.length,
		success: 0,
		failed: 0,
		notAvailable: 0,
		errors: [],
	};

	console.log(`🔄 Updating prices for ${itemNames.length} items...\n`);

	for (let i = 0; i < itemNames.length; i++) {
		const itemName = itemNames[i];
		const progress = `[${i + 1}/${itemNames.length}]`;

		console.log(`${progress} 📥 Fetching: ${itemName}`);

		try {
			const priceData = await fetchSteamPrice(itemName);

			if (!priceData) {
				console.log(`${progress}   ⚠️  Not available on market`);
				stats.notAvailable++;

				await Price.upsert({
					marketHashName: itemName,
					price: 0,
					lowestPrice: null,
					medianPrice: null,
					volume: 0,
					source: "steam",
				});
			} else {
				await Price.upsert({
					marketHashName: itemName,
					price: priceData.price,
					lowestPrice: priceData.lowestPrice,
					medianPrice: priceData.medianPrice,
					volume: priceData.volume,
					source: "steam",
				});

				console.log(
					`${progress}   ✅ $${priceData.price.toFixed(2)} (Low: $${
						priceData.lowestPrice?.toFixed(2) || "N/A"
					}, Med: $${priceData.medianPrice?.toFixed(2) || "N/A"})`
				);
				stats.success++;
			}
		} catch (error) {
			console.log(`${progress}   ❌ Error: ${error.message}`);
			stats.failed++;
			stats.errors.push({
				item: itemName,
				error: error.message,
			});
		}

		// Delay between requests
		if (i < itemNames.length - 1) {
			await new Promise((resolve) =>
				setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
			);
		}
	}

	return { success: true, stats };
}
