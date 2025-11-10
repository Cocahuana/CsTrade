import { DataTypes } from "sequelize";

export default function (sequelize) {
	const Item = sequelize.define(
		"Item",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING(255),
				allowNull: false,
				unique: true,
				comment:
					'Full item name with exterior (e.g., "AK-47 | The Oligarch (Factory New)")',
			},
			exterior: {
				type: DataTypes.ENUM(
					"Factory New",
					"Minimal Wear",
					"Field-Tested",
					"Well-Worn",
					"Battle-Scarred",
					"Not Painted",
					"Vanilla"
				),
				allowNull: true,
				comment: "Weapon exterior/wear condition",
			},
			imageUrl: {
				type: DataTypes.STRING(512),
				allowNull: true,
				comment: "Steam CDN image URL for the item",
			},
			savedImage: {
				type: DataTypes.TEXT,
				allowNull: true,
				comment: "Base64 encoded image or local file path (fallback)",
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
			tableName: "items",
			timestamps: true,
			underscored: true,
			indexes: [
				{
					unique: true,
					fields: ["name"],
				},
			],
		}
	);

	// Association method - will be called in index.js
	Item.associate = function (models) {
		Item.belongsToMany(models.Collection, {
			through: models.CollectionItem,
			foreignKey: "item_id",
			otherKey: "collection_id",
			as: "collections",
		});

		// Case Opening associations
		Item.hasOne(models.Price, {
			foreignKey: "marketHashName",
			sourceKey: "name",
			as: "price",
		});

		Item.hasMany(models.CaseItem, {
			foreignKey: "itemId",
			as: "caseItems",
		});
	};

	return Item;
}
