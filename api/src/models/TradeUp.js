import { DataTypes } from 'sequelize';

export default function (sequelize) {
	const TradeUp = sequelize.define(
		'TradeUp',
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				field: 'user_id',
			},
			inputsData: {
				type: DataTypes.JSONB,
				allowNull: false,
				comment: 'Array of 10 input items with their details',
				field: 'inputs_data',
			},
			predictedOutcomes: {
				type: DataTypes.JSONB,
				allowNull: false,
				comment: 'Array of predicted outcomes with probabilities',
				field: 'predicted_outcomes',
			},
			totalCost: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				field: 'total_cost',
			},
			expectedValue: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				field: 'expected_value',
			},
			expectedProfit: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				field: 'expected_profit',
			},
			profitability: {
				type: DataTypes.DECIMAL(5, 2),
				allowNull: false,
				comment: 'Percentage',
			},
			oddsToProfit: {
				type: DataTypes.DECIMAL(5, 2),
				allowNull: false,
				comment: 'Percentage',
				field: 'odds_to_profit',
			},
			// Actual results (if user completes the trade-up)
			actualOutcome: {
				type: DataTypes.STRING,
				allowNull: true,
				comment: 'Item name they actually got',
				field: 'actual_outcome',
			},
			actualPrice: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				field: 'actual_price',
			},
			actualProfit: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				field: 'actual_profit',
			},
			status: {
				type: DataTypes.ENUM('planned', 'completed', 'profit', 'loss'),
				defaultValue: 'planned',
			},
			notes: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			completedAt: {
				type: DataTypes.DATE,
				allowNull: true,
				field: 'completed_at',
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: 'created_at',
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: 'updated_at',
			},
		},
		{
			tableName: 'trade_ups',
			timestamps: true,
			underscored: true,
			indexes: [
				{
					fields: ['user_id'],
				},
				{
					fields: ['status'],
				},
				{
					fields: ['created_at'],
				},
				{
					fields: ['profitability'],
				},]
			},
			)

	// Associations
	TradeUp.associate = function (models) {
		TradeUp.belongsTo(models.User, {
			foreignKey: 'userId',
			as: 'user',
		});
	};

	// Instance methods
	TradeUp.prototype.complete = async function (outcome, price) {
		this.actualOutcome = outcome;
		this.actualPrice = price;
		this.actualProfit = price - parseFloat(this.totalCost);
		this.status =
			this.actualProfit > 0
				? 'profit'
				: this.actualProfit < 0
				? 'loss'
				: 'completed';
		this.completedAt = new Date();

		await this.save();
		return this;
	};

	// Class methods
	TradeUp.getStats = async function (userId) {
		const { Op } = sequelize.Sequelize;

		const stats = await this.findAll({
			where: { userId },
			attributes: [
				[sequelize.fn('COUNT', sequelize.col('id')), 'total'],
				[
					sequelize.fn(
						'COUNT',
						sequelize.literal("CASE WHEN status = 'profit' THEN 1 END")
					),
					'profitable',
				],
				[
					sequelize.fn('SUM', sequelize.col('actual_profit')),
					'totalProfit',
				],
				[sequelize.fn('AVG', sequelize.col('profitability')), 'avgProfitability'],
			],
			raw: true,
		});

		return stats[0];
	};

	return TradeUp;
}

