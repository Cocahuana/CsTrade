import { DataTypes } from "sequelize";

export default function (sequelize) {
	const Collection = sequelize.define(
		"Collection",
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
			tableName: "collections",
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
	Collection.associate = function (models) {
		Collection.belongsToMany(models.Item, {
			through: models.CollectionItem,
			foreignKey: "collection_id",
			otherKey: "item_id",
			as: "items",
		});
	};

	return Collection;
}
