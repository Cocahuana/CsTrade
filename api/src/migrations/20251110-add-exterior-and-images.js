import { DataTypes } from "sequelize";

export async function up(queryInterface) {
	// Add exterior, imageUrl, and savedImage to items table
	await queryInterface.addColumn("items", "exterior", {
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
	});

	await queryInterface.addColumn("items", "image_url", {
		type: DataTypes.STRING(512),
		allowNull: true,
		comment: "Steam CDN image URL for the item",
	});

	await queryInterface.addColumn("items", "saved_image", {
		type: DataTypes.TEXT,
		allowNull: true,
		comment: "Base64 encoded image or local file path (fallback)",
	});

	// Add exterior to prices table
	await queryInterface.addColumn("prices", "exterior", {
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
		comment: "Weapon exterior/wear condition - affects price significantly",
	});
}

export async function down(queryInterface) {
	// Remove columns from items table
	await queryInterface.removeColumn("items", "exterior");
	await queryInterface.removeColumn("items", "image_url");
	await queryInterface.removeColumn("items", "saved_image");

	// Remove column from prices table
	await queryInterface.removeColumn("prices", "exterior");

	// Drop the ENUM type (PostgreSQL specific)
	await queryInterface.sequelize.query(
		'DROP TYPE IF EXISTS "enum_items_exterior";'
	);
	await queryInterface.sequelize.query(
		'DROP TYPE IF EXISTS "enum_prices_exterior";'
	);
}
