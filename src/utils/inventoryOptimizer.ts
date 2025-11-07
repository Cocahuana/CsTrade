import type { InventoryItem, PriceData } from "../types/steam";
import type {
	OptimalTradeUp,
	PredictedOutcome,
	TradeUpStats,
	OptimizerSettings,
} from "../types/optimizer";

// Rarity progression for trade-ups
const RARITY_TIERS = [
	"Consumer Grade",
	"Industrial Grade",
	"Mil-Spec Grade",
	"Restricted",
	"Classified",
	"Covert",
] as const;

// Get next rarity tier
function getNextRarity(currentRarity: string): string | null {
	const index = RARITY_TIERS.findIndex((r) => currentRarity.includes(r));
	if (index === -1 || index === RARITY_TIERS.length - 1) return null;
	return RARITY_TIERS[index + 1];
}

// Group items by rarity and collection
function groupInventory(items: InventoryItem[]) {
	const groups: Record<string, InventoryItem[]> = {};

	items.forEach((item) => {
		const key = `${item.rarity}|${item.collection || "Unknown"}`;
		if (!groups[key]) groups[key] = [];
		groups[key].push(item);
	});

	return groups;
}

// Calculate all possible 10-item combinations from a group
function* generateCombinations(
	items: InventoryItem[],
	size: number = 10
): Generator<InventoryItem[]> {
	if (items.length < size) return;

	// For performance, limit to reasonable number of combinations
	// If more than 20 items, sample combinations instead of all
	if (items.length > 20) {
		// Random sampling approach
		for (let i = 0; i < Math.min(100, items.length - size + 1); i++) {
			const shuffled = [...items].sort(() => Math.random() - 0.5);
			yield shuffled.slice(0, size);
		}
	} else {
		// Full combinations for smaller groups
		yield* combinationsRecursive(items, size, 0, []);
	}
}

function* combinationsRecursive(
	items: InventoryItem[],
	size: number,
	start: number,
	current: InventoryItem[]
): Generator<InventoryItem[]> {
	if (current.length === size) {
		yield [...current];
		return;
	}

	for (let i = start; i <= items.length - (size - current.length); i++) {
		current.push(items[i]);
		yield* combinationsRecursive(items, size, i + 1, current);
		current.pop();
	}
}

// Calculate expected value of a trade-up
function calculateTradeUpStats(
	inputs: InventoryItem[],
	outcomes: PredictedOutcome[],
	prices: Record<string, PriceData>
): TradeUpStats {
	// Calculate total cost
	const totalCost = inputs.reduce((sum, item) => {
		const price = prices[item.marketHashName]?.price || item.price || 0;
		return sum + price;
	}, 0);

	// Calculate expected value from outcomes
	const expectedValue = outcomes.reduce((sum, outcome) => {
		return sum + outcome.estimatedPrice * outcome.probability;
	}, 0);

	const expectedProfit = expectedValue - totalCost;
	const profitability =
		totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;

	// Calculate odds to profit
	const profitableOutcomes = outcomes.filter(
		(o) => o.estimatedPrice > totalCost
	);
	const oddsToProfit =
		profitableOutcomes.reduce((sum, o) => sum + o.probability, 0) * 100;

	// Determine risk level
	const variance = outcomes.reduce((sum, o) => {
		const diff = o.estimatedPrice - expectedValue;
		return sum + diff * diff * o.probability;
	}, 0);

	const standardDeviation = Math.sqrt(variance);
	const coefficientOfVariation =
		expectedValue > 0 ? standardDeviation / expectedValue : 0;

	let risk: "low" | "medium" | "high";
	if (coefficientOfVariation < 0.3) risk = "low";
	else if (coefficientOfVariation < 0.7) risk = "medium";
	else risk = "high";

	// Confidence based on price availability
	const pricesAvailable = inputs.filter(
		(i) => prices[i.marketHashName]
	).length;
	const confidence = (pricesAvailable / inputs.length) * 100;

	return {
		totalCost,
		expectedValue,
		expectedProfit,
		profitability,
		oddsToProfit,
		risk,
		confidence,
	};
}

// Get possible outcomes for given inputs
function getPossibleOutcomes(
	inputs: InventoryItem[],
	prices: Record<string, PriceData>
): PredictedOutcome[] {
	// Group inputs by collection
	const collectionCounts: Record<string, number> = {};
	inputs.forEach((item) => {
		const collection = item.collection || "Unknown";
		collectionCounts[collection] = (collectionCounts[collection] || 0) + 1;
	});

	// Get next rarity
	const currentRarity = inputs[0].rarity;
	const nextRarity = getNextRarity(currentRarity);

	if (!nextRarity) return [];

	// For now, create mock outcomes based on collections
	// In production, you'd query a database of actual CS2 skins
	const outcomes: PredictedOutcome[] = Object.entries(collectionCounts).map(
		([collection, count]) => {
			const probability = count / inputs.length;
			const marketHashName = `${collection} ${nextRarity} Item`; // Mock
			const estimatedPrice = prices[marketHashName]?.price || 0;

			return {
				name: marketHashName,
				marketHashName,
				rarity: nextRarity,
				exterior: inputs[0].exterior || "Field-Tested",
				collection,
				probability,
				estimatedPrice,
				minFloat: 0.0,
				maxFloat: 1.0,
				imageUrl: inputs[0].imageUrl,
			};
		}
	);

	return outcomes;
}

// Main optimizer function
export function findOptimalTradeUps(
	inventory: InventoryItem[],
	prices: Record<string, PriceData>,
	settings: OptimizerSettings
): OptimalTradeUp[] {
	const suggestions: OptimalTradeUp[] = [];
	const groups = groupInventory(inventory);

	// Iterate through each group
	Object.entries(groups).forEach(([_key, items]) => {
		// Skip if not enough items
		if (items.length < 10) return;

		// Generate combinations
		let combinationIndex = 0;
		for (const combination of generateCombinations(items, 10)) {
			combinationIndex++;

			// Get possible outcomes
			const outcomes = getPossibleOutcomes(combination, prices);
			if (outcomes.length === 0) continue;

			// Calculate stats
			const stats = calculateTradeUpStats(combination, outcomes, prices);

			// Apply filters from settings
			if (stats.profitability < settings.minProfitability) continue;
			if (stats.totalCost > settings.maxCost) continue;
			if (stats.oddsToProfit < settings.minOddsToProfit) continue;

			// Risk filter
			const riskLevels = { low: 1, medium: 2, high: 3 };
			if (riskLevels[stats.risk] > riskLevels[settings.maxRisk]) continue;

			// StatTrak filter
			if (
				!settings.allowStatTrak &&
				combination.some((item) => item.statTrak)
			)
				continue;

			suggestions.push({
				id: `tradeup-${Date.now()}-${combinationIndex}`,
				inputs: combination,
				outcomes,
				stats,
				rank: 0, // Will be set after sorting
			});

			// Limit suggestions for performance
			if (suggestions.length >= 100) break;
		}
	});

	// Sort by profitability (descending)
	suggestions.sort((a, b) => b.stats.profitability - a.stats.profitability);

	// Assign ranks
	suggestions.forEach((suggestion, index) => {
		suggestion.rank = index + 1;
	});

	// Return top suggestions
	return suggestions.slice(0, settings.preferCollections ? 20 : 10);
}

// Quick analysis function for stats
export function analyzeInventory(
	inventory: InventoryItem[],
	prices: Record<string, PriceData>
) {
	const totalValue = inventory.reduce((sum, item) => {
		return sum + (prices[item.marketHashName]?.price || item.price || 0);
	}, 0);

	const groups = groupInventory(inventory);
	const possibleTradeUps = Object.values(groups).filter(
		(g) => g.length >= 10
	).length;

	return {
		totalItems: inventory.length,
		totalValue,
		possibleTradeUps,
		groups: Object.keys(groups).length,
	};
}
