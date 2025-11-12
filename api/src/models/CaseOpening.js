import { DataTypes } from "sequelize";

export default function (sequelize) {
	const CaseOpening = sequelize.define(
		"CaseOpening",
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			caseId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "case_id",
				references: {
					model: "custom_cases",
					key: "id",
				},
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "user_id",
				references: {
					model: "users",
					key: "id",
				},
			},
			itemWonId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "item_won_id",
				references: {
					model: "items",
					key: "id",
				},
			},
			creditsSpent: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "credits_spent",
			},
			itemValueCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "item_value_credits",
				comment: "Price of won item at time of opening",
			},
			platformFeeCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "platform_fee_credits",
				comment: "10% platform commission",
			},
			creatorFeeCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "creator_fee_credits",
				comment: "15% to case creator",
			},
			poolContributionCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "pool_contribution_credits",
				comment: "75% to reward pool",
			},
			houseProfitCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "house_profit_credits",
				comment:
					"House profit/loss: creditsSpent - itemValueCredits (positive = house won, negative = house lost)",
			},
			randomSeed: {
				type: DataTypes.STRING(64),
				allowNull: true,
				field: "random_seed",
				comment: "Hex seed for provably fair verification",
			},
			randomValue: {
				type: DataTypes.DECIMAL(10, 6),
				allowNull: true,
				field: "random_value",
				comment: "Random number 0-100 used for item selection",
			},
			openedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
				field: "opened_at",
			},
		},
		{
			tableName: "case_openings",
			timestamps: false,
			underscored: true,
			indexes: [
				{
					fields: ["user_id"],
				},
				{
					fields: ["case_id"],
				},
				{
					fields: ["opened_at"],
				},
			],
		}
	);

	CaseOpening.associate = function (models) {
		CaseOpening.belongsTo(models.CustomCase, {
			foreignKey: "caseId",
			as: "case",
		});

		CaseOpening.belongsTo(models.User, {
			foreignKey: "userId",
			as: "user",
		});

		CaseOpening.belongsTo(models.Item, {
			foreignKey: "itemWonId",
			as: "itemWon",
		});

		CaseOpening.hasOne(models.UserInventory, {
			foreignKey: "caseOpeningId",
			as: "inventoryItem",
		});
	};

	return CaseOpening;
}
