import { DataTypes } from 'sequelize';

export default function (sequelize) {
	const User = sequelize.define(
		'User',
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			steamId: {
				type: DataTypes.STRING(20),
				allowNull: false,
				unique: true,
				field: 'steam_id',
			},
			steamName: {
				type: DataTypes.STRING,
				allowNull: true,
				field: 'steam_name',
			},
			avatarUrl: {
				type: DataTypes.STRING,
				allowNull: true,
				field: 'avatar_url',
			},
			totalTradeUps: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				field: 'total_trade_ups',
			},
			profitableTradeUps: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				field: 'profitable_trade_ups',
			},
			totalProfit: {
				type: DataTypes.DECIMAL(12, 2),
				defaultValue: 0,
				field: 'total_profit',
			},
			lastActive: {
				type: DataTypes.DATE,
				allowNull: true,
				field: 'last_active',
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
			tableName: 'users',
			timestamps: true,
			underscored: true,
			indexes: [
				{
					unique: true,
					fields: ['steam_id'],
				},
				{
					fields: ['last_active'],
				},
			],
		}
	);

	// Associations
	User.associate = function (models) {
		User.hasMany(models.TradeUp, {
			foreignKey: 'userId',
			as: 'tradeUps',
		});
	};

	// Instance methods
	User.prototype.updateStats = async function () {
		const TradeUp = sequelize.models.TradeUp;
		const tradeUps = await TradeUp.findAll({
			where: { userId: this.id },
		});

		this.totalTradeUps = tradeUps.length;
		this.profitableTradeUps = tradeUps.filter((t) => t.profit > 0).length;
		this.totalProfit = tradeUps.reduce(
			(sum, t) => sum + parseFloat(t.profit),
			0
		);

		await this.save();
		return this;
	};

	return User;
}

