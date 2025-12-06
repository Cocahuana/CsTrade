import { DataTypes } from "sequelize";

export async function up(queryInterface) {
    try {
        await queryInterface.addColumn("prices", "image_url", {
            type: DataTypes.STRING(512),
            allowNull: true,
            comment: "Steam CDN image URL for the item",
        });
    } catch (e) {
        console.log("Column prices.image_url already exists, skipping");
    }
}

export async function down(queryInterface) {
    await queryInterface.removeColumn("prices", "image_url");
}
