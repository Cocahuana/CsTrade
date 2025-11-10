import { DataTypes } from "sequelize";

export default function (sequelize) {
	const Transaction = sequelize.define(
		"Transaction",
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
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
			type: {
				type: DataTypes.ENUM(
					"deposit",
					"case_opening",
					"creator_earnings",
					"platform_fee",
					"withdrawal",
					"refund"
				),
				allowNull: false,
			},
			amountCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "amount_credits",
				comment: "Positive for credit, negative for debit",
			},
			balanceBefore: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "balance_before",
			},
			balanceAfter: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "balance_after",
			},
			caseOpeningId: {
				type: DataTypes.UUID,
				allowNull: true,
				field: "case_opening_id",
				references: {
					model: "case_openings",
					key: "id",
				},
			},
			relatedCaseId: {
				type: DataTypes.UUID,
				allowNull: true,
				field: "related_case_id",
				references: {
					model: "custom_cases",
					key: "id",
				},
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: "created_at",
			},
		},
		{
			tableName: "transactions",
			timestamps: false,
			underscored: true,
			indexes: [
				{
					fields: ["user_id"],
				},
				{
					fields: ["type"],
				},
				{
					fields: ["created_at"],
				},
			],
		}
	);

	Transaction.associate = function (models) {
		Transaction.belongsTo(models.User, {
			foreignKey: "userId",
			as: "user",
		});

		Transaction.belongsTo(models.CaseOpening, {
			foreignKey: "caseOpeningId",
			as: "caseOpening",
		});

		Transaction.belongsTo(models.CustomCase, {
			foreignKey: "relatedCaseId",
			as: "relatedCase",
		});
	};

	return Transaction;
}
