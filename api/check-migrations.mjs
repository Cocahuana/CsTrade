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
	const [results] = await sequelize.query(
		'SELECT name FROM "SequelizeMeta" ORDER BY name'
	);
	console.log("\nMigrations already run:");
	results.forEach((r) => console.log("  ✓", r.name));
	console.log("\nTotal:", results.length, "migrations");
	process.exit(0);
} catch (e) {
	console.error("Error:", e.message);
	process.exit(1);
}
