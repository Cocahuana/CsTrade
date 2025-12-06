const { Sequelize } = require("sequelize");
const config = require("./src/config/database.cjs").development;

const sequelize = new Sequelize(
	config.database,
	config.username,
	config.password,
	config
);

sequelize
	.query('SELECT name FROM "SequelizeMeta" ORDER BY name')
	.then(([results]) => {
		console.log("\nMigrations already run:");
		results.forEach((r) => console.log("  ✓", r.name));
		console.log("\nTotal:", results.length, "migrations");
		process.exit(0);
	})
	.catch((e) => {
		console.error("Error:", e.message);
		process.exit(1);
	});
