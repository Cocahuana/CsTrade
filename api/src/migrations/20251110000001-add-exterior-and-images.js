import { DataTypes } from "sequelize";

export async function up(queryInterface) {
	// Add exterior, imageUrl, and savedImage to items table
	try {
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
	} catch (e) {
		console.log("Column items.exterior already exists, skipping");
	}

	try {
		await queryInterface.addColumn("items", "image_url", {
			type: DataTypes.STRING(512),
			allowNull: true,
			comment: "Steam CDN image URL for the item",
		});
	} catch (e) {
		console.log("Column items.image_url already exists, skipping");
	}

	try {
		await queryInterface.addColumn("items", "saved_image", {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Base64 encoded image or local file path (fallback)",
		});
	} catch (e) {
		console.log("Column items.saved_image already exists, skipping");
	}

	// Add exterior to prices table
	try {
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
	} catch (e) {
		console.log("Column prices.exterior already exists, skipping");
	}
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
