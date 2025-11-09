/**
 * Migration: Create Users table
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('users', {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			steam_id: {
				type: Sequelize.STRING(20),
				allowNull: false,
				unique: true,
			},
			steam_name: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			avatar_url: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			total_trade_ups: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			profitable_trade_ups: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			total_profit: {
				type: Sequelize.DECIMAL(12, 2),
				defaultValue: 0,
			},
			last_active: {
				type: Sequelize.DATE,
				allowNull: true,
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
		await queryInterface.addIndex('users', ['steam_id'], {
			unique: true,
			name: 'users_steam_id_unique',
		});

		await queryInterface.addIndex('users', ['last_active'], {
			name: 'users_last_active_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('users');
	},
};

