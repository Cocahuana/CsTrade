"use strict";

module.exports = {
	async up(queryInterface, Sequelize) {
		// Add item_base_name column to prices table
		await queryInterface.addColumn("prices", "item_base_name", {
			type: Sequelize.STRING(255),
			allowNull: true,
			comment:
				'Base item name without exterior (e.g., "AK-47 | The Oligarch") - for linking with items table',
		});

		// Add index for better query performance
		await queryInterface.addIndex("prices", ["item_base_name"], {
			name: "prices_item_base_name_idx",
		});

		// Populate item_base_name by extracting from market_hash_name
		await queryInterface.sequelize.query(`
			UPDATE prices 
			SET item_base_name = CASE
				WHEN market_hash_name LIKE '% (Factory New)' THEN REPLACE(market_hash_name, ' (Factory New)', '')
				WHEN market_hash_name LIKE '% (Minimal Wear)' THEN REPLACE(market_hash_name, ' (Minimal Wear)', '')
				WHEN market_hash_name LIKE '% (Field-Tested)' THEN REPLACE(market_hash_name, ' (Field-Tested)', '')
				WHEN market_hash_name LIKE '% (Well-Worn)' THEN REPLACE(market_hash_name, ' (Well-Worn)', '')
				WHEN market_hash_name LIKE '% (Battle-Scarred)' THEN REPLACE(market_hash_name, ' (Battle-Scarred)', '')
				ELSE market_hash_name
			END
			WHERE item_base_name IS NULL
		`);
	},

	async down(queryInterface, Sequelize) {
		// Remove index
		await queryInterface.removeIndex("prices", "prices_item_base_name_idx");

		// Remove column
		await queryInterface.removeColumn("prices", "item_base_name");
	},
};
