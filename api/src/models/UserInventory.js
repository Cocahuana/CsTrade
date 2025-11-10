import { DataTypes } from "sequelize";

export default function (sequelize) {
	const UserInventory = sequelize.define(
		"UserInventory",
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
			itemId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "item_id",
				references: {
					model: "items",
					key: "id",
				},
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
			acquiredValueCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "acquired_value_credits",
				comment: "Item value when won",
			},
			currentValueCredits: {
				type: DataTypes.INTEGER,
				allowNull: true,
				field: "current_value_credits",
				comment: "Updated periodically from prices table",
			},
			isTradeable: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				field: "is_tradeable",
			},
			isListedForSale: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				field: "is_listed_for_sale",
			},
			acquiredAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
				field: "acquired_at",
			},
		},
		{
			tableName: "user_inventory",
			timestamps: false,
			underscored: true,
			indexes: [
				{
					fields: ["user_id"],
				},
				{
					fields: ["item_id"],
				},
				{
					unique: true,
					fields: ["user_id", "case_opening_id"],
					name: "unique_user_opening",
				},
			],
		}
	);

	UserInventory.associate = function (models) {
		UserInventory.belongsTo(models.User, {
			foreignKey: "userId",
			as: "user",
		});

		UserInventory.belongsTo(models.Item, {
			foreignKey: "itemId",
			as: "item",
		});

		UserInventory.belongsTo(models.CaseOpening, {
			foreignKey: "caseOpeningId",
			as: "caseOpening",
		});
	};

	// Instance method to update current value
	UserInventory.prototype.updateCurrentValue = async function () {
		const Price = sequelize.models.Price;
		const Item = sequelize.models.Item;

		const item = await Item.findByPk(this.itemId);
		if (!item) return;

		const price = await Price.findOne({
			where: { marketHashName: item.name },
		});

		if (price) {
			this.currentValueCredits = Math.round(
				parseFloat(price.price) * 100
			);
			await this.save();
		}
	};

	return UserInventory;
}
