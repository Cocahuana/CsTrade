"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Add new columns to users table
		await queryInterface.addColumn("users", "balance_credits", {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
			comment: "1 USD = 100 credits",
		});

		await queryInterface.addColumn("users", "total_earned_credits", {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
			comment: "Lifetime earnings as case creator",
		});

		await queryInterface.addColumn("users", "total_spent_credits", {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
			comment: "Lifetime spending on case openings",
		});

		await queryInterface.addColumn("users", "total_cases_opened", {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
		});

		await queryInterface.addColumn("users", "total_cases_created", {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
		});

		// Add constraint for non-negative balance
		await queryInterface.addConstraint("users", {
			fields: ["balance_credits"],
			type: "check",
			name: "balance_non_negative",
			where: {
				balance_credits: {
					[Sequelize.Op.gte]: 0,
				},
			},
		});

		// Create custom_cases table
		await queryInterface.createTable("custom_cases", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			creator_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "users",
					key: "id",
				},
				onDelete: "CASCADE",
			},
			collection_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
				references: {
					model: "collections",
					key: "id",
				},
			},
			title: {
				type: Sequelize.STRING(255),
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			image_url: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			price_credits: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			times_opened: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			total_revenue_credits: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			is_active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			is_featured: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create indexes for custom_cases
		await queryInterface.addIndex("custom_cases", ["creator_id"]);
		await queryInterface.addIndex("custom_cases", ["collection_id"]);
		await queryInterface.addIndex("custom_cases", ["is_active"]);
		await queryInterface.addIndex("custom_cases", ["is_featured"]);
		await queryInterface.addIndex("custom_cases", ["times_opened"]);

		// Create case_items table
		await queryInterface.createTable("case_items", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			case_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "custom_cases",
					key: "id",
				},
				onDelete: "CASCADE",
			},
			item_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "items",
					key: "id",
				},
			},
			drop_chance_percentage: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: false,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create unique index for case_items
		await queryInterface.addIndex("case_items", ["case_id", "item_id"], {
			unique: true,
			name: "unique_case_item",
		});
		await queryInterface.addIndex("case_items", ["case_id"]);

		// Create case_openings table
		await queryInterface.createTable("case_openings", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			case_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "custom_cases",
					key: "id",
				},
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "users",
					key: "id",
				},
			},
			item_won_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "items",
					key: "id",
				},
			},
			credits_spent: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			item_value_credits: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			platform_fee_credits: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			creator_fee_credits: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			pool_contribution_credits: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			random_seed: {
				type: Sequelize.STRING(64),
				allowNull: true,
			},
			random_value: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: true,
			},
			opened_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
		});

		// Create indexes for case_openings
		await queryInterface.addIndex("case_openings", ["user_id"]);
		await queryInterface.addIndex("case_openings", ["case_id"]);
		await queryInterface.addIndex("case_openings", ["opened_at"]);

		// Create transactions table
		await queryInterface.createTable("transactions", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "users",
					key: "id",
				},
			},
			type: {
				type: Sequelize.ENUM(
					"deposit",
					"case_opening",
					"creator_earnings",
					"platform_fee",
					"withdrawal",
					"refund"
				),
				allowNull: false,
			},
			amount_credits: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			balance_before: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			balance_after: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			case_opening_id: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "case_openings",
					key: "id",
				},
			},
			related_case_id: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "custom_cases",
					key: "id",
				},
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create indexes for transactions
		await queryInterface.addIndex("transactions", ["user_id"]);
		await queryInterface.addIndex("transactions", ["type"]);
		await queryInterface.addIndex("transactions", ["created_at"]);

		// Create user_inventory table
		await queryInterface.createTable("user_inventory", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "users",
					key: "id",
				},
			},
			item_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "items",
					key: "id",
				},
			},
			case_opening_id: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "case_openings",
					key: "id",
				},
			},
			acquired_value_credits: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			current_value_credits: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			is_tradeable: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			is_listed_for_sale: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			acquired_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
		});

		// Create indexes for user_inventory
		await queryInterface.addIndex("user_inventory", ["user_id"]);
		await queryInterface.addIndex("user_inventory", ["item_id"]);
		await queryInterface.addIndex(
			"user_inventory",
			["user_id", "case_opening_id"],
			{
				unique: true,
				name: "unique_user_opening",
			}
		);
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable("user_inventory");
		await queryInterface.dropTable("transactions");
		await queryInterface.dropTable("case_openings");
		await queryInterface.dropTable("case_items");
		await queryInterface.dropTable("custom_cases");

		// Remove columns from users table
		await queryInterface.removeConstraint("users", "balance_non_negative");
		await queryInterface.removeColumn("users", "total_cases_created");
		await queryInterface.removeColumn("users", "total_cases_opened");
		await queryInterface.removeColumn("users", "total_spent_credits");
		await queryInterface.removeColumn("users", "total_earned_credits");
		await queryInterface.removeColumn("users", "balance_credits");
	},
};
