/**
 * Standalone script to fetch prices for all collection items
 *
 * Usage:
 *   node scripts/fetchAllPrices.js [options]
 *
 * Options:
 *   --skip-graffiti    Skip graffiti items (default: true)
 *   --update-existing  Update existing price records (default: false)
 *   --limit N          Limit to N items for testing
 *
 * Examples:
 *   node scripts/fetchAllPrices.js --limit 10
 *   node scripts/fetchAllPrices.js --update-existing
 *   node scripts/fetchAllPrices.js --skip-graffiti=false
 */

import { fetchAllItemPrices } from "../src/services/priceFetcher.js";
import db from "../src/models/index.js";

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
	skipGraffiti: true,
	updateExisting: false,
	limit: null,
};

args.forEach((arg) => {
	if (arg.startsWith("--skip-graffiti=")) {
		options.skipGraffiti = arg.split("=")[1] === "true";
	} else if (arg === "--skip-graffiti") {
		options.skipGraffiti = true;
	} else if (arg === "--update-existing") {
		options.updateExisting = true;
	} else if (arg.startsWith("--limit=")) {
		options.limit = parseInt(arg.split("=")[1]);
	} else if (arg.startsWith("--limit")) {
		const nextArg = args[args.indexOf(arg) + 1];
		if (nextArg && !nextArg.startsWith("--")) {
			options.limit = parseInt(nextArg);
		}
	}
});

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║         CS2 Collection Items - Price Fetcher               ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");
console.log("Options:");
console.log(`  Skip graffiti: ${options.skipGraffiti}`);
console.log(`  Update existing: ${options.updateExisting}`);
console.log(`  Limit: ${options.limit || "None (process all items)"}\n`);

// Estimate time
const estimatedItems = options.limit || 900; // Approximate non-graffiti items
const estimatedMinutes = (estimatedItems * 1.5) / 60; // 1.5 seconds per item
console.log(`⏱️  Estimated time: ~${estimatedMinutes.toFixed(1)} minutes\n`);

// Run the price fetch
async function run() {
	try {
		await db.sequelize.authenticate();
		console.log("✅ Database connected\n");

		const result = await fetchAllItemPrices(options);

		if (!result.success) {
			console.error("\n❌ Price fetch failed:", result.error);
			process.exit(1);
		}

		console.log("\n✅ Price fetch completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Fatal error:", error);
		process.exit(1);
	} finally {
		await db.sequelize.close();
	}
}

run();
