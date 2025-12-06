import db from "../models/index.js";
import {
    fetchCollectionPrices,
    fetchAllCollectionsPrices,
} from "../services/collectionPriceFetcher.js";

const args = process.argv.slice(2);
const collectionArg = args.find((arg) => arg.startsWith("--collection="));
const collectionName = collectionArg ? collectionArg.split("=")[1] : null;

async function main() {
    try {
        await db.sequelize.authenticate();
        console.log("✅ Database connected.");

        if (collectionName) {
            await fetchCollectionPrices(collectionName);
        } else {
            await fetchAllCollectionsPrices();
        }

        console.log("✅ Price update complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

main();
