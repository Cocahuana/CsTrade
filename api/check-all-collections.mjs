import db from "./src/models/index.js";

try {
	const collections = await db.Collection.findAll({
		order: [["id", "ASC"]],
		limit: 10,
	});

	console.log("\nChecking prices for first 10 collections:\n");

	for (const collection of collections) {
		// Get items in this collection
		const items = await db.Item.findAll({
			include: [
				{
					model: db.Collection,
					as: "collections",
					where: { id: collection.id },
					through: { attributes: [] },
				},
			],
		});

		// Count prices for these items
		let totalPrices = 0;
		for (const item of items) {
			const prices = await db.Price.count({
				where: { itemBaseName: item.name },
			});
			totalPrices += prices;
		}

		const status = totalPrices > 0 ? "✓" : "✗";
		console.log(
			`${status} Collection ${collection.id}: ${collection.name}`
		);
		console.log(`   Items: ${items.length}, Prices: ${totalPrices}\n`);
	}

	process.exit(0);
} catch (e) {
	console.error("Error:", e.message);
	process.exit(1);
}
