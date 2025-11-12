import db from "./models/index.js";
import { up } from "./migrations/20251110-add-house-profit-to-case-openings.js";

async function runMigration() {
	try {
		console.log("🔄 Running migration: add-house-profit-to-case-openings");
		await up(db.sequelize.queryInterface, db.Sequelize);
		console.log("✅ Migration completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	}
}

runMigration();
