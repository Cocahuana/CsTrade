import { DataTypes } from "sequelize";

export default function (sequelize) {
	const CollectionItem = sequelize.define(
		"CollectionItem",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			collectionId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "collection_id",
				references: {
					model: "collections",
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
				onDelete: "CASCADE",
			},
			rarity: {
				type: DataTypes.ENUM(
					"Consumer Grade",
					"Industrial Grade",
					"Mil-Spec Grade",
					"Restricted",
					"Classified",
					"Covert"
				),
				allowNull: false,
				comment: "Item rarity within the collection",
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: "created_at",
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: "updated_at",
			},
		},
		{
			tableName: "collection_items",
			timestamps: true,
			underscored: true,
			indexes: [
				{
					unique: true,
					fields: ["collection_id", "item_id"],
					name: "collection_item_unique",
				},
				{
					fields: ["collection_id"],
				},
				{
					fields: ["item_id"],
				},
				{
					fields: ["rarity"],
				},
			],
		}
	);

	// Association method - will be called in index.js
	CollectionItem.associate = function (models) {
		CollectionItem.belongsTo(models.Collection, {
			foreignKey: "collection_id",
			as: "collection",
		});
		CollectionItem.belongsTo(models.Item, {
			foreignKey: "item_id",
			as: "item",
		});
	};

	return CollectionItem;
}
