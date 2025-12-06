import db from "./src/models/index.js";

const collectionId = 6;

try {
	// Get all items in collection 6
	const items = await db.Item.findAll({
		include: [
			{
				model: db.Collection,
				as: "collections",
				where: { id: collectionId },
				through: { attributes: [] },
			},
		],
	});

	console.log(`\nItems in collection ${collectionId}:`, items.length);

	let totalPrices = 0;
	for (const item of items) {
		const prices = await db.Price.findAll({
			where: { itemBaseName: item.name },
		});
		totalPrices += prices.length;
		if (prices.length > 0) {
			console.log(`  ✓ ${item.name}: ${prices.length} prices`);
		} else {
			console.log(`  ✗ ${item.name}: NO PRICES`);
		}
	}

	console.log(
		`\nTotal prices for collection ${collectionId}: ${totalPrices}`
	);
	process.exit(0);
} catch (e) {
	console.error("Error:", e.message);
	process.exit(1);
}
