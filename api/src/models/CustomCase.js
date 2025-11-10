import { DataTypes } from "sequelize";

export default function (sequelize) {
	const CustomCase = sequelize.define(
		"CustomCase",
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			creatorId: {
				type: DataTypes.UUID,
				allowNull: false,
				field: "creator_id",
				references: {
					model: "users",
					key: "id",
				},
				onDelete: "CASCADE",
			},
			collectionId: {
				type: DataTypes.INTEGER,
				allowNull: true,
				field: "collection_id",
				references: {
					model: "collections",
					key: "id",
				},
				comment: "Optional: Link to CS2 collection",
			},
			title: {
				type: DataTypes.STRING(255),
				allowNull: false,
				validate: {
					len: [5, 255],
				},
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			imageUrl: {
				type: DataTypes.STRING,
				allowNull: true,
				field: "image_url",
			},
			priceCredits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				field: "price_credits",
				comment: "Fixed price to open (e.g., 100 credits = $1)",
				validate: {
					min: 50,
					max: 10000,
				},
			},
			timesOpened: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				field: "times_opened",
			},
			totalRevenueCredits: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				field: "total_revenue_credits",
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				field: "is_active",
			},
			isFeatured: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				field: "is_featured",
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
			tableName: "custom_cases",
			timestamps: true,
			underscored: true,
			indexes: [
				{
					fields: ["creator_id"],
				},
				{
					fields: ["collection_id"],
				},
				{
					fields: ["is_active"],
				},
				{
					fields: ["is_featured"],
				},
				{
					fields: ["times_opened"],
				},
			],
		}
	);

	CustomCase.associate = function (models) {
		CustomCase.belongsTo(models.User, {
			foreignKey: "creatorId",
			as: "creator",
		});

		CustomCase.belongsTo(models.Collection, {
			foreignKey: "collectionId",
			as: "collection",
		});

		CustomCase.hasMany(models.CaseItem, {
			foreignKey: "caseId",
			as: "caseItems",
		});

		CustomCase.hasMany(models.CaseOpening, {
			foreignKey: "caseId",
			as: "openings",
		});
	};

	// Instance methods
	CustomCase.prototype.calculateExpectedValue = async function () {
		const items = await this.getCaseItems({
			include: [
				{
					model: sequelize.models.Item,
					as: "item",
					include: [
						{
							model: sequelize.models.Price,
							as: "price",
						},
					],
				},
			],
		});

		let expectedValue = 0;
		for (const caseItem of items) {
			const itemPrice = caseItem.item?.price?.price || 0;
			const dropChance = parseFloat(caseItem.dropChancePercentage) / 100;
			expectedValue += itemPrice * dropChance;
		}

		return Math.round(expectedValue * 100); // Return in credits
	};

	CustomCase.prototype.calculateHouseEdge = async function () {
		const expectedValue = await this.calculateExpectedValue();
		const houseEdge =
			((this.priceCredits - expectedValue) / this.priceCredits) * 100;
		return parseFloat(houseEdge.toFixed(2));
	};

	return CustomCase;
}
