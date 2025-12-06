import db from "../models/index.js";

/**
 * Script to link items with their lowest prices regardless of exterior
 * This handles the mismatch between item names (without exterior) and price names (with exterior)
 */
async function linkItemsWithLowestPrices() {
	try {
		await db.sequelize.authenticate();
		console.log("✅ Database connected.\n");

		// Get all items without prices
		const items = await db.Item.findAll({
			attributes: ["id", "name", "exterior"],
		});

		console.log(`📦 Processing ${items.length} items...\n`);

		let matched = 0;
		let notFound = 0;

		for (const item of items) {
			// Find the lowest price for this item (matching the base name, any exterior)
			// The item name doesn't have exterior, but prices do
			const lowestPrice = await db.Price.findOne({
				where: {
					marketHashName: {
						[db.Sequelize.Op.like]: `${item.name}%`,
					},
				},
				order: [["price", "ASC"]],
				attributes: [
					"marketHashName",
					"price",
					"lowestPrice",
					"exterior",
				],
			});

			if (lowestPrice) {
				// Update the item's name to match the price's market_hash_name (with exterior)
				// OR create a new price entry with the item's name

				// Option 1: Create a price entry for the base item name (without exterior)
				// using the lowest price found
				await db.Price.upsert({
					marketHashName: item.name,
					exterior: lowestPrice.exterior,
					price: lowestPrice.price,
					lowestPrice: lowestPrice.lowestPrice,
					medianPrice: null,
					volume: 0,
					source: "steam",
				});

				matched++;
				if (matched % 50 === 0) {
					console.log(`  ✅ Processed ${matched} items...`);
				}
			} else {
				notFound++;
			}
		}

		console.log(`\n📊 Results:`);
		console.log(`  ✅ Matched and linked: ${matched}`);
		console.log(`  ❌ Not found: ${notFound}`);
		console.log(
			`  📈 Success rate: ${((matched / items.length) * 100).toFixed(
				2
			)}%\n`
		);

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

linkItemsWithLowestPrices();
