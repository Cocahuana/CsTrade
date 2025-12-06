import fetch from "node-fetch";
import * as cheerio from "cheerio";
import db from "../models/index.js";
import { getCollectionTag } from "../data/collectionTags.js";

const { Item, Price, Collection } = db;

const STEAM_APP_ID = 730;
const DELAY_BETWEEN_PAGES = 10000; // 10 seconds to avoid rate limiting

// Rotate through different user agents to appear more like different browsers
const USER_AGENTS = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
];

let currentUserAgentIndex = 0;

function getNextUserAgent() {
	const userAgent = USER_AGENTS[currentUserAgentIndex];
	currentUserAgentIndex = (currentUserAgentIndex + 1) % USER_AGENTS.length;
	return userAgent;
}

/**
 * Fetch prices for a specific collection using Steam Market Search
 * @param {string} collectionName
 */
export async function fetchCollectionPrices(collectionName) {
	console.log(`\n📦 Fetching prices for collection: ${collectionName}`);

	const tag = getCollectionTag(collectionName);
	console.log(`   🏷️  Using tag: ${tag}`);

	const stats = {
		totalFound: 0,
		updated: 0,
		errors: 0,
	};

	let start = 0;
	const count = 100; // Max items per page
	let hasMore = true;

	try {
		while (hasMore) {
			const url = `https://steamcommunity.com/market/search/render/?query=&start=${start}&count=${count}&search_descriptions=0&sort_column=default&sort_dir=desc&appid=${STEAM_APP_ID}&category_730_ItemSet%5B%5D=${tag}&norender=1`;

			console.log(`   📄 Fetching page starting at ${start}...`);

			const userAgent = getNextUserAgent();
			const response = await fetch(url, {
				headers: {
					"User-Agent": userAgent,
					Accept: "application/json, text/html, */*",
					"Accept-Language": "en-US,en;q=0.9",
					"Accept-Encoding": "gzip, deflate, br",
					Referer: "https://steamcommunity.com/market/",
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
				},
			});

			if (!response.ok) {
				throw new Error(`Steam API returned ${response.status}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error("Steam API returned success: false");
			}

			const totalCount = data.total_count;
			const resultsHtml = data.results_html;

			console.log(`   📊 Total count from API: ${totalCount || 0}`);

			if (!resultsHtml) {
				// Check if we have results array
				if (data.results && Array.isArray(data.results)) {
					console.log(
						`   ℹ️ Found ${data.results.length} items in 'results' array.`
					);

					for (const item of data.results) {
						// Extract data from JSON result
						// Structure based on typical Steam API response
						const name = item.hash_name || item.name;
						const priceText =
							item.sell_price_text || item.sale_price_text || "";

						// Clean price
						const priceMatch = priceText.match(
							/\$([0-9,]+\.[0-9]{2})/
						);
						const price = priceMatch
							? parseFloat(priceMatch[1].replace(/,/g, ""))
							: item.sell_price / 100 || 0;

						const imageUrl = item.asset_description?.icon_url
							? `https://community.cloudflare.steamstatic.com/economy/image/${item.asset_description.icon_url}`
							: null;

						if (name) {
							stats.totalFound++;

							// Extract exterior
							const exteriorMatch = name.match(
								/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/
							);
							const exterior = exteriorMatch
								? exteriorMatch[1]
								: "Not Painted";

							// Extract base name (without exterior)
							const itemBaseName = exteriorMatch
								? name.replace(` (${exterior})`, "")
								: name;

							// Update Price
							await Price.upsert({
								marketHashName: name,
								itemBaseName,
								exterior,
								price: price,
								lowestPrice: price,
								medianPrice: null,
								volume: 0,
								imageUrl: imageUrl || null,
								source: "steam",
							}); // Update Item image if missing
							if (imageUrl) {
								await Item.update(
									{ imageUrl, exterior },
									{ where: { name: name } }
								);
							}

							stats.updated++;
						}
					}
				} else {
					console.log(
						"   ⚠️ No results_html and no results array in response."
					);
					console.log("   Keys:", Object.keys(data));
				}

				// If we processed via JSON, we might still need pagination logic
				// But usually JSON response is different. Let's assume standard pagination works
			} else {
				// Parse HTML
				const $ = cheerio.load(resultsHtml);
				const items = $(".market_listing_row_link");

				if (items.length === 0) {
					hasMore = false;
					break;
				}

				console.log(
					`   🔍 Found ${items.length} items on this page (HTML)`
				);

				for (let i = 0; i < items.length; i++) {
					const element = items[i];
					const $el = $(element);

					// Extract data
					const href = $el.attr("href");
					const name = $el
						.find(".market_listing_item_name")
						.text()
						.trim();
					const priceText = $el
						.find(".market_listing_their_price .normal_price")
						.text()
						.trim();

					// Clean price
					const priceMatch = priceText.match(/\$([0-9,]+\.[0-9]{2})/);
					const price = priceMatch
						? parseFloat(priceMatch[1].replace(/,/g, ""))
						: 0;

					const imageSrc = $el
						.find("img.market_listing_item_img")
						.attr("src");
					const srcSet = $el
						.find("img.market_listing_item_img")
						.attr("srcset");
					const imageUrl = srcSet
						? srcSet.split(",").pop().trim().split(" ")[0]
						: imageSrc;

					if (name) {
						stats.totalFound++;

						// Extract exterior
						const exteriorMatch = name.match(
							/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/
						);
						const exterior = exteriorMatch
							? exteriorMatch[1]
							: "Not Painted";

						// Extract base name (without exterior)
						const itemBaseName = exteriorMatch
							? name.replace(` (${exterior})`, "")
							: name;

						// Update Price
						await Price.upsert({
							marketHashName: name,
							itemBaseName,
							exterior,
							price: price,
							lowestPrice: price,
							medianPrice: null,
							volume: 0,
							imageUrl: imageUrl || null,
							source: "steam",
						});

						// Update Item image
						if (imageUrl) {
							await Item.update(
								{ imageUrl, exterior },
								{ where: { name: name } }
							);
						}

						stats.updated++;
					}
				}
			}

			start += count;
			if (start >= totalCount) {
				hasMore = false;
			}

			// Delay
			if (hasMore) {
				await new Promise((resolve) =>
					setTimeout(resolve, DELAY_BETWEEN_PAGES)
				);
			}
		}

		console.log(`   ✅ Finished. Updated ${stats.updated} items.`);
		return { success: true, stats };
	} catch (error) {
		console.error(
			`   ❌ Error fetching collection prices: ${error.message}`
		);
		return { success: false, error: error.message };
	}
}

/**
 * Fetch prices for all collections in the database
 */
export async function fetchAllCollectionsPrices() {
	const collections = await Collection.findAll();
	console.log(`Found ${collections.length} collections in database.`);

	for (const collection of collections) {
		await fetchCollectionPrices(collection.name);
		// Delay between collections
		await new Promise((resolve) =>
			setTimeout(resolve, DELAY_BETWEEN_PAGES)
		);
	}
}
