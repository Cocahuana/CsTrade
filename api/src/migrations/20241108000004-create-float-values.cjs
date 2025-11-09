/**
 * Migration: Create FloatValues table
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('float_values', {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			asset_id: {
				type: Sequelize.STRING(30),
				allowNull: false,
				unique: true,
			},
			float_value: {
				type: Sequelize.DECIMAL(10, 8),
				allowNull: false,
			},
			paintseed: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			paintindex: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			defindex: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			stickers: {
				type: Sequelize.JSONB,
				allowNull: true,
			},
			inspect_link: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			source: {
				type: Sequelize.ENUM('csgofloat', 'manual', 'other'),
				defaultValue: 'csgofloat',
			},
			fetched_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
		await queryInterface.addIndex('float_values', ['asset_id'], {
			unique: true,
			name: 'float_values_asset_id_unique',
		});

		await queryInterface.addIndex('float_values', ['float_value'], {
			name: 'float_values_float_value_idx',
		});

		await queryInterface.addIndex('float_values', ['fetched_at'], {
			name: 'float_values_fetched_at_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('float_values');
	},
};

