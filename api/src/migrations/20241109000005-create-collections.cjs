/**
 * Migration: Create Collections, Items, and CollectionItems tables
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create Collections table
		await queryInterface.createTable("collections", {
			id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: Sequelize.STRING(255),
				allowNull: false,
				unique: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// Create Items table
		await queryInterface.createTable("items", {
			id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: Sequelize.STRING(255),
				allowNull: false,
				unique: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// Create CollectionItems pivot table
		await queryInterface.createTable("collection_items", {
			id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			collection_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "collections",
					key: "id",
				},
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			item_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "items",
					key: "id",
				},
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			rarity: {
				type: Sequelize.ENUM(
					"Consumer Grade",
					"Industrial Grade",
					"Mil-Spec Grade",
					"Restricted",
					"Classified",
					"Covert"
				),
				allowNull: false,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// Add indexes for Collections
		await queryInterface.addIndex("collections", ["name"], {
			unique: true,
			name: "collections_name_unique",
		});

		// Add indexes for Items
		await queryInterface.addIndex("items", ["name"], {
			unique: true,
			name: "items_name_unique",
		});

		// Add indexes for CollectionItems
		await queryInterface.addIndex(
			"collection_items",
			["collection_id", "item_id"],
			{
				unique: true,
				name: "collection_items_collection_item_unique",
			}
		);

		await queryInterface.addIndex("collection_items", ["collection_id"], {
			name: "collection_items_collection_id_idx",
		});

		await queryInterface.addIndex("collection_items", ["item_id"], {
			name: "collection_items_item_id_idx",
		});

		await queryInterface.addIndex("collection_items", ["rarity"], {
			name: "collection_items_rarity_idx",
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order (respecting foreign key constraints)
		await queryInterface.dropTable("collection_items");
		await queryInterface.dropTable("items");
		await queryInterface.dropTable("collections");
	},
};
