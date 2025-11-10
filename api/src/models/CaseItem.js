import { DataTypes } from "sequelize";

export default function (sequelize) {
	const CaseItem = sequelize.define(
		"CaseItem",
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
				onDelete: "CASCADE",
			},
			itemId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "item_id",
				references: {
					model: "items",
					key: "id",
				},
			},
			dropChancePercentage: {
				type: DataTypes.DECIMAL(5, 2),
				allowNull: false,
				field: "drop_chance_percentage",
				comment: "e.g., 15.50 for 15.50%",
				validate: {
					min: 0.01,
					max: 100,
				},
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: "created_at",
			},
		},
		{
			tableName: "case_items",
			timestamps: false,
			underscored: true,
			indexes: [
				{
					unique: true,
					fields: ["case_id", "item_id"],
				},
				{
					fields: ["case_id"],
				},
			],
		}
	);

	CaseItem.associate = function (models) {
		CaseItem.belongsTo(models.CustomCase, {
			foreignKey: "caseId",
			as: "case",
		});

		CaseItem.belongsTo(models.Item, {
			foreignKey: "itemId",
			as: "item",
		});
	};

	return CaseItem;
}
