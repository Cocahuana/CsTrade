/**
 * Migration: Create TradeUps table
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('trade_ups', {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			inputs_data: {
				type: Sequelize.JSONB,
				allowNull: false,
			},
			predicted_outcomes: {
				type: Sequelize.JSONB,
				allowNull: false,
			},
			total_cost: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: false,
			},
			expected_value: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: false,
			},
			expected_profit: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: false,
			},
			profitability: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: false,
			},
			odds_to_profit: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: false,
			},
			actual_outcome: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			actual_price: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
			},
			actual_profit: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
			},
			status: {
				type: Sequelize.ENUM('planned', 'completed', 'profit', 'loss'),
				defaultValue: 'planned',
			},
			notes: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			completed_at: {
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
		await queryInterface.addIndex('trade_ups', ['user_id'], {
			name: 'trade_ups_user_id_idx',
		});

		await queryInterface.addIndex('trade_ups', ['status'], {
			name: 'trade_ups_status_idx',
		});

		await queryInterface.addIndex('trade_ups', ['created_at'], {
			name: 'trade_ups_created_at_idx',
		});

		await queryInterface.addIndex('trade_ups', ['profitability'], {
			name: 'trade_ups_profitability_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('trade_ups');
	},
};

