import { Sequelize } from "sequelize";
import databaseConfig from "./src/config/database.js";

const config = databaseConfig.development;
const sequelize = new Sequelize(
	config.database,
	config.username,
	config.password,
	config
);

try {
	const [tables] = await sequelize.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);

	console.log("\nDatabase tables:");
	tables.forEach((t) => console.log("  •", t.table_name));
	console.log("\nTotal:", tables.length, "tables");

	// Check if case opening tables exist
	const caseOpeningTables = [
		"custom_cases",
		"case_items",
		"case_openings",
		"transactions",
		"user_inventory",
	];
	const existing = caseOpeningTables.filter((tableName) =>
		tables.some((t) => t.table_name === tableName)
	);

	console.log("\nCase Opening System Tables:");
	caseOpeningTables.forEach((tableName) => {
		const exists = existing.includes(tableName);
		console.log(`  ${exists ? "✓" : "✗"} ${tableName}`);
	});

	process.exit(0);
} catch (e) {
	console.error("Error:", e.message);
	process.exit(1);
}
