import crypto from "crypto";
import db from "../models/index.js";

const {
	CustomCase,
	CaseItem,
	CaseOpening,
	User,
	Transaction,
	UserInventory,
	Item,
	Price,
} = db;

/**
 * Generate cryptographically secure random number for item selection
 */
function generateRandomSelection() {
	const randomBytes = crypto.randomBytes(4);
	const randomNumber = (randomBytes.readUInt32BE(0) / 0xffffffff) * 100;

	return {
		seed: randomBytes.toString("hex"),
		value: randomNumber,
	};
}

/**
 * Select item from case based on drop chances
 */
function selectItemFromDropTable(caseItems, randomValue) {
	// Sort by drop chance for cumulative calculation
	const sorted = [...caseItems].sort(
		(a, b) =>
			parseFloat(a.dropChancePercentage) -
			parseFloat(b.dropChancePercentage)
	);

	let cumulative = 0;
	const ranges = sorted.map((item) => {
		const start = cumulative;
		cumulative += parseFloat(item.dropChancePercentage);
		return {
			itemId: item.itemId,
			start,
			end: cumulative,
			item: item.item,
		};
	});

	// Find which item was selected
	const selected = ranges.find(
		(r) => randomValue >= r.start && randomValue < r.end
	);

	return selected || ranges[ranges.length - 1]; // Fallback to last item
}

/**
 * Calculate fee distribution
 */
function calculateFees(openingPrice) {
	const platformFee = Math.floor(openingPrice * 0.1); // 10%
	const creatorFee = Math.floor(openingPrice * 0.15); // 15%
	const poolContribution = openingPrice - platformFee - creatorFee; // 75%

	return {
		platformFee,
		creatorFee,
		poolContribution,
	};
}

/**
 * Open a case
 */
export async function openCase(userId, caseId) {
	const transaction = await db.sequelize.transaction();

	try {
		// 1. Get case with items
		const customCase = await CustomCase.findByPk(caseId, {
			include: [
				{
					model: CaseItem,
					as: "caseItems",
					include: [
						{
							model: Item,
							as: "item",
							include: [
								{
									model: Price,
									as: "price",
								},
							],
						},
					],
				},
				{
					model: User,
					as: "creator",
				},
			],
			transaction,
		});

		if (!customCase || !customCase.isActive) {
			throw new Error("Case not found or inactive");
		}

		// 2. Get user
		const user = await User.findByPk(userId, {
			lock: true,
			transaction,
		});

		if (!user) {
			throw new Error("User not found");
		}

		// 3. Check balance
		if (user.balanceCredits < customCase.priceCredits) {
			throw new Error("Insufficient credits");
		}

		// 4. Generate random selection
		const random = generateRandomSelection();
		const selectedItem = selectItemFromDropTable(
			customCase.caseItems,
			random.value
		);

		// 5. Get item value
		const itemPrice = selectedItem.item?.price?.price || 0;
		const itemValueCredits = Math.round(parseFloat(itemPrice) * 100);

		// 6. Calculate fees
		const fees = calculateFees(customCase.priceCredits);

		// 7. Deduct credits from user
		const balanceBefore = user.balanceCredits;
		user.balanceCredits -= customCase.priceCredits;
		user.totalSpentCredits += customCase.priceCredits;
		user.totalCasesOpened += 1;
		await user.save({ transaction });

		// 8. Create transaction record for case opening (debit)
		await Transaction.create(
			{
				userId: user.id,
				type: "case_opening",
				amountCredits: -customCase.priceCredits,
				balanceBefore,
				balanceAfter: user.balanceCredits,
				relatedCaseId: customCase.id,
				description: `Opened case: ${customCase.title}`,
				createdAt: new Date(),
			},
			{ transaction }
		);

		// 9. Create case opening record
		const opening = await CaseOpening.create(
			{
				caseId: customCase.id,
				userId: user.id,
				itemWonId: selectedItem.itemId,
				creditsSpent: customCase.priceCredits,
				itemValueCredits,
				platformFeeCredits: fees.platformFee,
				creatorFeeCredits: fees.creatorFee,
				poolContributionCredits: fees.poolContribution,
				randomSeed: random.seed,
				randomValue: random.value,
			},
			{ transaction }
		);

		// 10. Add item to user inventory
		await UserInventory.create(
			{
				userId: user.id,
				itemId: selectedItem.itemId,
				caseOpeningId: opening.id,
				acquiredValueCredits: itemValueCredits,
				currentValueCredits: itemValueCredits,
			},
			{ transaction }
		);

		// 11. Pay creator fee
		const creator = await User.findByPk(customCase.creatorId, {
			lock: true,
			transaction,
		});

		if (creator) {
			const creatorBalanceBefore = creator.balanceCredits;
			creator.balanceCredits += fees.creatorFee;
			creator.totalEarnedCredits += fees.creatorFee;
			await creator.save({ transaction });

			// Create transaction for creator earnings
			await Transaction.create(
				{
					userId: creator.id,
					type: "creator_earnings",
					amountCredits: fees.creatorFee,
					balanceBefore: creatorBalanceBefore,
					balanceAfter: creator.balanceCredits,
					caseOpeningId: opening.id,
					relatedCaseId: customCase.id,
					description: `Earned from case opening: ${customCase.title}`,
					createdAt: new Date(),
				},
				{ transaction }
			);
		}

		// 12. Update case stats
		customCase.timesOpened += 1;
		customCase.totalRevenueCredits += customCase.priceCredits;
		await customCase.save({ transaction });

		// 13. Commit transaction
		await transaction.commit();

		// 14. Return result with full item details
		const result = await CaseOpening.findByPk(opening.id, {
			include: [
				{
					model: Item,
					as: "itemWon",
					include: [
						{
							model: Price,
							as: "price",
						},
					],
				},
				{
					model: CustomCase,
					as: "case",
				},
			],
		});

		return {
			opening: result,
			newBalance: user.balanceCredits,
			itemWon: selectedItem.item,
			itemValue: itemValueCredits,
			randomSeed: random.seed,
			randomValue: random.value,
		};
	} catch (error) {
		await transaction.rollback();
		throw error;
	}
}

/**
 * Calculate suggested probabilities based on item prices
 */
export async function calculateFairProbabilities(items, casePrice) {
	// Get item prices
	const itemsWithPrices = await Promise.all(
		items.map(async (itemId) => {
			const item = await Item.findByPk(itemId, {
				include: [
					{
						model: Price,
						as: "price",
					},
				],
			});

			const price = item?.price?.price || 1;
			return {
				itemId,
				price: parseFloat(price) * 100, // Convert to credits
			};
		})
	);

	// Calculate inverse value (items with lower value = higher drop chance)
	const probabilities = itemsWithPrices.map((item) => {
		const inverseValue = 1 / item.price;
		return { ...item, inverseValue };
	});

	// Normalize to sum to 100%
	const totalInverse = probabilities.reduce(
		(sum, p) => sum + p.inverseValue,
		0
	);
	const normalized = probabilities.map((p) => ({
		itemId: p.itemId,
		dropChance: parseFloat(
			((p.inverseValue / totalInverse) * 100).toFixed(2)
		),
		price: p.price,
	}));

	// Ensure probabilities sum to exactly 100% by adjusting the largest item
	const sum = normalized.reduce((acc, item) => acc + item.dropChance, 0);
	const diff = parseFloat((100 - sum).toFixed(2));

	if (Math.abs(diff) > 0) {
		// Find the item with the highest drop chance and adjust it
		const maxIndex = normalized.reduce(
			(maxIdx, item, idx, arr) =>
				item.dropChance > arr[maxIdx].dropChance ? idx : maxIdx,
			0
		);
		normalized[maxIndex].dropChance = parseFloat(
			(normalized[maxIndex].dropChance + diff).toFixed(2)
		);
	}

	// Calculate expected value
	const expectedValue = normalized.reduce((sum, item) => {
		return sum + item.price * (item.dropChance / 100);
	}, 0);

	// House edge
	const houseEdge = ((casePrice - expectedValue) / casePrice) * 100;

	return {
		probabilities: normalized.map((p) => ({
			item_id: p.itemId,
			drop_chance: p.dropChance,
		})),
		expectedValue: Math.round(expectedValue),
		houseEdge: parseFloat(houseEdge.toFixed(2)),
		isReasonable: houseEdge >= 10 && houseEdge <= 40,
	};
}

/**
 * Validate case probabilities sum to 100
 */
export function validateProbabilities(items) {
	const total = items.reduce(
		(sum, item) => sum + parseFloat(item.drop_chance || 0),
		0
	);
	const rounded = Math.round(total * 100) / 100;
	return Math.abs(rounded - 100) < 0.01;
}
