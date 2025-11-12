import { DataTypes } from "sequelize";

export default function (sequelize) {
	const Price = sequelize.define(
		"Price",
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			marketHashName: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
				field: "market_hash_name",
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
				comment:
					"Weapon exterior/wear condition - affects price significantly",
			},
			price: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				defaultValue: 0,
			},
			lowestPrice: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				field: "lowest_price",
			},
			medianPrice: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: true,
				field: "median_price",
			},
			volume: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
			imageUrl: {
				type: DataTypes.STRING(512),
				allowNull: true,
				field: "image_url",
				comment: "Steam CDN image URL for the item",
			},
			source: {
				type: DataTypes.ENUM("steam", "skinport", "manual"),
				defaultValue: "steam",
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: "updated_at",
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				field: "created_at",
			},
		},
		{
			tableName: "prices",
			timestamps: true,
			underscored: true,
			indexes: [
				{
					unique: true,
					fields: ["market_hash_name"],
				},
				{
					fields: ["updated_at"], // For cache expiration queries
				},
				{
					fields: ["source"],
				},
			],
		}
	);

	// Class methods
	Price.isExpired = function (priceRecord, expirationMinutes = 60) {
		const now = new Date();
		const diff = now - new Date(priceRecord.updatedAt);
		return diff > expirationMinutes * 60 * 1000;
	};

	// Instance methods
	Price.prototype.needsUpdate = function (expirationMinutes = 60) {
		return Price.isExpired(this, expirationMinutes);
	};

	return Price;
}
