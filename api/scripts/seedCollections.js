/**
 * Seed Collections Data from ScrapedCollections.json
 *
 * This script loads the scraped collection data and populates the database:
 * 1. Creates Collection records
 * 2. Creates unique Item records
 * 3. Creates CollectionItem records linking collections to items with rarity
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import db from "../src/models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedCollections() {
	try {
		console.log("Starting collection seeding process...\n");

		// Load scraped data
		const dataPath = join(__dirname, "../src/data/ScrapedCollections.json");
		const scrapedData = JSON.parse(readFileSync(dataPath, "utf-8"));

		// Get models
		const { Collection, Item, CollectionItem } = db;

		// Track statistics
		const stats = {
			collections: 0,
			items: 0,
			collectionItems: 0,
		};

		// Store all unique items across collections
		const uniqueItemsSet = new Set();

		// First pass: collect all unique items
		console.log("Analyzing unique items...");
		for (const [collectionName, rarityGroups] of Object.entries(
			scrapedData
		)) {
			for (const [rarity, items] of Object.entries(rarityGroups)) {
				items.forEach((itemName) => uniqueItemsSet.add(itemName));
			}
		}
		console.log(
			`Found ${uniqueItemsSet.size} unique items across all collections\n`
		);

		// Start transaction
		const transaction = await db.sequelize.transaction();

		try {
			// Bulk insert all unique items
			console.log("Inserting items...");
			const itemRecords = Array.from(uniqueItemsSet).map((name) => ({
				name,
			}));
			await Item.bulkCreate(itemRecords, {
				transaction,
				ignoreDuplicates: true,
			});
			stats.items = uniqueItemsSet.size;
			console.log(`✓ Inserted ${stats.items} items\n`);

			// Create a map of item names to IDs for quick lookup
			const allItems = await Item.findAll({ transaction });
			const itemNameToId = new Map(
				allItems.map((item) => [item.name, item.id])
			);

			// Bulk insert collections and create collection-item relationships
			console.log("Processing collections...");
			const collectionItemRecords = [];

			for (const [collectionName, rarityGroups] of Object.entries(
				scrapedData
			)) {
				// Create collection
				const collection = await Collection.create(
					{ name: collectionName },
					{ transaction }
				);
				stats.collections++;

				// Prepare collection-item relationships
				for (const [rarity, items] of Object.entries(rarityGroups)) {
					items.forEach((itemName) => {
						const itemId = itemNameToId.get(itemName);
						if (itemId) {
							collectionItemRecords.push({
								collection_id: collection.id,
								item_id: itemId,
								rarity: rarity,
							});
						} else {
							console.warn(
								`Warning: Item "${itemName}" not found in items table`
							);
						}
					});
				}

				console.log(
					`✓ ${collectionName} - ${
						Object.values(rarityGroups).flat().length
					} items`
				);
			}

			// Bulk insert collection-item relationships
			console.log("\nInserting collection-item relationships...");
			await CollectionItem.bulkCreate(collectionItemRecords, {
				transaction,
				ignoreDuplicates: true,
			});
			stats.collectionItems = collectionItemRecords.length;
			console.log(
				`✓ Inserted ${stats.collectionItems} collection-item relationships\n`
			);

			// Commit transaction
			await transaction.commit();

			// Print summary
			console.log("═".repeat(50));
			console.log("SEEDING COMPLETE");
			console.log("═".repeat(50));
			console.log(`Collections created: ${stats.collections}`);
			console.log(`Unique items created: ${stats.items}`);
			console.log(`Collection-item links: ${stats.collectionItems}`);
			console.log("═".repeat(50));
		} catch (error) {
			// Rollback on error
			await transaction.rollback();
			throw error;
		}
	} catch (error) {
		console.error("Error seeding collections:", error);
		process.exit(1);
	} finally {
		// Close database connection
		await db.sequelize.close();
	}
}

// Run seeder
seedCollections();
