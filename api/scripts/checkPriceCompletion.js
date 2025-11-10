import { QueryTypes } from "sequelize";
import db from "../src/models/index.js";

const { sequelize } = db;

async function checkPriceCompletion() {
	try {
		console.log("\n📊 Collections with Most Price Coverage:\n");

		const results = await sequelize.query(
			`
      SELECT 
        c.name as collection_name,
        COUNT(DISTINCT i.id) as total_items,
        COUNT(DISTINCT p.id) as items_with_prices,
        ROUND(COUNT(DISTINCT p.id)::decimal / COUNT(DISTINCT i.id) * 100, 2) as completion_percentage
      FROM collections c
      INNER JOIN collection_items ci ON c.id = ci.collection_id
      INNER JOIN items i ON ci.item_id = i.id
      LEFT JOIN prices p ON i.name = p.market_hash_name
      GROUP BY c.id, c.name
      ORDER BY completion_percentage DESC, items_with_prices DESC
      LIMIT 15
    `,
			{ type: QueryTypes.SELECT }
		);

		console.log(
			"Collection Name".padEnd(45) +
				"Items".padEnd(10) +
				"Priced".padEnd(10) +
				"Complete"
		);
		console.log("=".repeat(80));

		results.forEach((r) => {
			console.log(
				r.collection_name.padEnd(45) +
					r.total_items.toString().padEnd(10) +
					r.items_with_prices.toString().padEnd(10) +
					r.completion_percentage +
					"%"
			);
		});

		console.log("\n");
		process.exit(0);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

checkPriceCompletion();
