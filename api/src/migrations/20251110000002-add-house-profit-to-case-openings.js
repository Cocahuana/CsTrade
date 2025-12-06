import { DataTypes } from "sequelize";

/**
 * Add house_profit_credits column to case_openings table
 * This tracks how much the house won (positive) or lost (negative) on each opening
 * Calculation: creditsSpent - itemValueCredits
 */

export async function up(queryInterface) {
	await queryInterface.addColumn("case_openings", "house_profit_credits", {
		type: DataTypes.INTEGER,
		allowNull: true, // Null for existing records
		field: "house_profit_credits",
		comment:
			"House profit/loss: creditsSpent - itemValueCredits (positive = house won, negative = house lost)",
	});

	// Backfill existing records
	await queryInterface.sequelize.query(`
		UPDATE case_openings 
		SET house_profit_credits = credits_spent - item_value_credits
		WHERE house_profit_credits IS NULL
	`);

	// Make it NOT NULL after backfilling
	await queryInterface.changeColumn("case_openings", "house_profit_credits", {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: "house_profit_credits",
		comment:
			"House profit/loss: creditsSpent - itemValueCredits (positive = house won, negative = house lost)",
	});
}

export async function down(queryInterface) {
	await queryInterface.removeColumn("case_openings", "house_profit_credits");
}
