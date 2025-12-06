import db from "../models/index.js";

async function main() {
	try {
		await db.sequelize.authenticate();

		// Total items in the database
		const totalItems = await db.Item.count();
		console.log(`\n📦 Total items in database: ${totalItems}`);

		// Items with prices
		const itemsWithPrices = await db.sequelize.query(
			`
            SELECT COUNT(DISTINCT i.id) as count
            FROM items i
            INNER JOIN prices p ON i.name = p.market_hash_name
        `,
			{ type: db.Sequelize.QueryTypes.SELECT }
		);

		console.log(`💰 Items with prices: ${itemsWithPrices[0].count}`);

		// Items without prices
		const itemsWithoutPrices = await db.sequelize.query(
			`
            SELECT COUNT(i.id) as count
            FROM items i
            LEFT JOIN prices p ON i.name = p.market_hash_name
            WHERE p.market_hash_name IS NULL
        `,
			{ type: db.Sequelize.QueryTypes.SELECT }
		);

		console.log(`❌ Items without prices: ${itemsWithoutPrices[0].count}`);

		// Show percentage
		const percentage = (
			(itemsWithPrices[0].count / totalItems) *
			100
		).toFixed(2);
		console.log(`📊 Coverage: ${percentage}%\n`);

		// Show some items without prices (first 10)
		if (itemsWithoutPrices[0].count > 0) {
			console.log(`\n🔍 Sample of items without prices:`);
			const sampleItems = await db.sequelize.query(
				`
                SELECT i.name, i.exterior
                FROM items i
                LEFT JOIN prices p ON i.name = p.market_hash_name
                WHERE p.market_hash_name IS NULL
                LIMIT 10
            `,
				{ type: db.Sequelize.QueryTypes.SELECT }
			);

			sampleItems.forEach((item) => {
				console.log(`   - ${item.name}`);
			});

			if (itemsWithoutPrices[0].count > 10) {
				console.log(
					`   ... and ${itemsWithoutPrices[0].count - 10} more\n`
				);
			}
		}

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

main();
