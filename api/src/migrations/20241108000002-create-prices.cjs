/**
 * Migration: Create Prices table
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('prices', {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			market_hash_name: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			price: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: false,
				defaultValue: 0,
			},
			lowest_price: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
			},
			median_price: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
			},
			volume: {
				type: Sequelize.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
			source: {
				type: Sequelize.ENUM('steam', 'skinport', 'manual'),
				defaultValue: 'steam',
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Add indexes
		await queryInterface.addIndex('prices', ['market_hash_name'], {
			unique: true,
			name: 'prices_market_hash_name_unique',
		});

		await queryInterface.addIndex('prices', ['updated_at'], {
			name: 'prices_updated_at_idx',
		});

		await queryInterface.addIndex('prices', ['source'], {
			name: 'prices_source_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('prices');
	},
};

