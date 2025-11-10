import https from "https";

// Collections to scrape
const collections = [
	"the-genesis-collection",
	"the-fever-collection",
	"the-train-2025-collection",
	"the-boreal-collection",
	"the-radiant-collection",
	"the-ascent-collection",
	"the-gallery-collection",
	"the-sport-and-field-collection",
	"the-overpass-2024-collection",
	"the-graphic-design-collection",
	"the-anubis-collection",
	"the-2021-mirage-collection",
	"the-2021-dust-2-collection",
	"the-2021-vertigo-collection",
	"the-2021-train-collection",
	"the-havoc-collection",
	"the-control-collection",
	"the-canals-collection",
	"the-st-marc-collection",
	"the-norse-collection",
	"the-x-ray-collection",
	"the-vertigo-collection",
	"the-blacksite-collection",
	"the-2018-nuke-collection",
	"the-2018-inferno-collection",
	"the-operation-hydra-collection",
	"the-glove-collection",
	"the-wildfire-collection",
	"the-revolver-case-collection",
	"the-shadow-collection",
	"the-gods-and-monsters-collection",
	"the-chop-shop-collection",
	"the-rising-sun-collection",
	"the-falchion-collection",
	"the-vanguard-collection",
	"the-cobblestone-collection",
	"the-inferno-collection",
	"the-nuke-collection",
	"the-overpass-collection",
	"the-cache-collection",
	"the-esports-2014-summer-collection",
	"the-baggage-collection",
	"the-breakout-collection",
	"the-huntsman-collection",
	"the-bank-collection",
	"the-phoenix-collection",
	"the-arms-deal-3-collection",
	"the-esports-2013-winter-collection",
	"the-winter-offensive-collection",
	"the-dust-2-collection",
	"the-train-collection",
	"the-mirage-collection",
	"the-safehouse-collection",
	"the-italy-collection",
	"the-lake-collection",
	"the-arms-deal-2-collection",
	"the-bravo-collection",
	"the-alpha-collection",
	"the-aztec-collection",
	"the-esports-2013-collection",
	"the-dust-collection",
	"the-militia-collection",
	"the-arms-deal-collection",
	"the-office-collection",
	"the-assault-collection",
];

/**
 * Convert URL slug to proper collection name
 */
function slugToName(slug) {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
		.replace(/^The /, "The ")
		.replace(/ Collection$/, " Collection");
}

/**
 * Fetch HTML content from URL
 */
function fetchHTML(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => resolve(data));
			})
			.on("error", reject);
	});
}

/**
 * Extract items from HTML by rarity
 */
function extractItems(html) {
	const result = {
		"Consumer Grade": [],
		"Industrial Grade": [],
		"Mil-Spec Grade": [],
		Restricted: [],
		Classified: [],
		Covert: [],
	};

	try {
		// Extract item names and rarities using regex
		// Pattern: card:{title:"X",hiddenTitlePrefix:"Y",...rarity:{name:"Z"
		const cardPattern =
			/card:\{title:"([^"]+)",hiddenTitlePrefix:"([^"]*)"[\s\S]*?rarity:\{[^}]*name:"([^"]+)"/g;
		let match;

		while ((match = cardPattern.exec(html)) !== null) {
			const title = match[1]; // e.g., "The Oligarch"
			const prefix = match[2]; // e.g., "AK-47 | "
			const rarity = match[3]; // e.g., "Covert"

			const fullName = prefix + title;

			if (result[rarity]) {
				result[rarity].push(fullName);
			}
		}

		return result;
	} catch (error) {
		console.log("  ⚠️  Error extracting items:", error.message);
		return result;
	}
}

/**
 * Scrape a single collection
 */
async function scrapeCollection(slug) {
	const url = `https://totalcsgo.com/skins/collections/${slug}`;
	console.log(`  📥 Scraping: ${slug}`);

	try {
		const html = await fetchHTML(url);
		const items = extractItems(html);
		const collectionName = slugToName(slug);

		const itemCount = Object.values(items).flat().length;
		console.log(`    ✅ ${collectionName} - ${itemCount} items`);

		return {
			name: collectionName,
			items: items,
		};
	} catch (error) {
		console.error(`    ❌ Error scraping ${slug}:`, error.message);
		return null;
	}
}

/**
 * Scrape all collections
 * @returns {Promise<Object>} Result with success, data, stats, and optional error
 */
export async function scrapeCollections() {
	const startTime = Date.now();
	const results = {};
	let totalItems = 0;

	console.log(`🔄 Starting to scrape ${collections.length} collections...`);

	try {
		for (let i = 0; i < collections.length; i++) {
			const collection = await scrapeCollection(collections[i]);

			if (collection) {
				results[collection.name] = collection.items;
				const itemCount = Object.values(collection.items).flat().length;
				totalItems += itemCount;
			}

			// Delay between requests to be polite (2 seconds)
			if (i < collections.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		return {
			success: true,
			data: results,
			stats: {
				collectionsScraped: Object.keys(results).length,
				totalItems,
				duration: `${duration}s`,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
			data: results, // Return partial results
			stats: {
				collectionsScraped: Object.keys(results).length,
				totalItems,
				duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
			},
		};
	}
}
