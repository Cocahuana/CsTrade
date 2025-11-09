import { DataTypes } from 'sequelize';

export default function (sequelize) {
	const FloatValue = sequelize.define(
		'FloatValue',
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
			},
			assetId: {
				type: DataTypes.STRING(30),
				allowNull: false,
				unique: true,
				field: 'asset_id',
			},
			floatValue: {
				type: DataTypes.DECIMAL(10, 8),
				allowNull: false,
				field: 'float_value',
			},
			paintseed: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			paintindex: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			defindex: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			stickers: {
				type: DataTypes.JSONB,
				allowNull: true,
				comment: 'Array of sticker data',
			},
			inspectLink: {
				type: DataTypes.STRING,
				allowNull: true,
				field: 'inspect_link',
			},
			source: {
				type: DataTypes.ENUM('csgofloat', 'manual', 'other'),
				defaultValue: 'csgofloat',
			},
			fetchedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW,
				field: 'fetched_at',
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
			tableName: 'float_values',
			timestamps: true,
			underscored: true,
			indexes: [
				{
					unique: true,
					fields: ['asset_id'],
				},
				{
					fields: ['float_value'],
				},
				{
					fields: ['fetched_at'],
				},
			],
		}
	);

	// Float values never change, so no expiration needed
	// But we can add a method to check if data is very old (for safety)
	FloatValue.isVeryOld = function (floatRecord, daysOld = 365) {
		const now = new Date();
		const diff = now - new Date(floatRecord.fetchedAt);
		return diff > daysOld * 24 * 60 * 60 * 1000;
	};

	return FloatValue;
}

