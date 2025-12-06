import db from "../models/index.js";

async function main() {
	try {
		await db.sequelize.authenticate();

		const totalCount = await db.Price.count();
		console.log(`\n📊 Total items with prices: ${totalCount}`);

		const recentCount = await db.Price.count({
			where: {
				updatedAt: {
					[db.Sequelize.Op.gte]: new Date(
						Date.now() - 60 * 60 * 1000
					),
				},
			},
		});
		console.log(`⏰ Updated in last hour: ${recentCount}`);

		const withPricesGreaterThanZero = await db.Price.count({
			where: {
				price: {
					[db.Sequelize.Op.gt]: 0,
				},
			},
		});
		console.log(`💰 Items with price > $0: ${withPricesGreaterThanZero}`);

		const steamSource = await db.Price.count({
			where: {
				source: "steam",
			},
		});
		console.log(`🔹 From Steam Market: ${steamSource}\n`);

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

main();
