import db from "../models/index.js";

async function checkColumns() {
    try {
        await db.sequelize.authenticate();
        console.log("✅ Database connected.");

        const [results, metadata] = await db.sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'prices';"
        );

        console.log("Columns in 'prices' table:", results.map(r => r.column_name));
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkColumns();
