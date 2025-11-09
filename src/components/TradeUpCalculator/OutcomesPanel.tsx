import { useMemo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import type { InventoryItem, PriceData } from "../../types/steam";
import type { PredictedOutcome } from "../../types/optimizer";
import { setPrices } from "../../store/slices/optimizerSlice";

interface OutcomesPanelProps {
	inputs: InventoryItem[];
	allInventory: InventoryItem[];
	prices: Record<string, PriceData>;
}

// Rarity progression
const RARITY_TIERS = [
	"Consumer Grade",
	"Industrial Grade",
	"Mil-Spec Grade",
	"Restricted",
	"Classified",
	"Covert",
] as const;

function getNextRarity(currentRarity: string): string | null {
	const index = RARITY_TIERS.findIndex((r) => currentRarity.includes(r));
	if (index === -1 || index === RARITY_TIERS.length - 1) return null;
	return RARITY_TIERS[index + 1];
}

export default function OutcomesPanel({
	inputs,
	allInventory,
	prices,
}: OutcomesPanelProps) {
	const dispatch = useDispatch<AppDispatch>();
	const { collectionItems } = useSelector((state: RootState) => state.cs2Items);
	const [isFetchingPrices, setIsFetchingPrices] = useState(false);

	// Function to fetch prices in batch
	const fetchBatchPrices = async (marketHashNames: string[]) => {
		if (marketHashNames.length === 0) return;

		try {
			setIsFetchingPrices(true);
			console.log(
				`💰 Fetching prices for ${marketHashNames.length} outcome items...`
			);

			const response = await fetch(
				"http://localhost:5000/api/steam/market/prices/batch",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ marketHashNames }),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.success && result.data) {
				console.log(
					`✅ Successfully fetched ${result.stats.fetched} outcome prices`
				);
				// Merge with existing prices
				dispatch(setPrices({ ...prices, ...result.data }));
			}
		} catch (err) {
			console.error("Failed to fetch outcome prices:", err);
		} finally {
			setIsFetchingPrices(false);
		}
	};

	// Calculate outcomes using collection items database
	const { outcomes, stats } = useMemo(() => {
		console.log("🎯 OutcomesPanel calculating...");
		console.log("  - Inputs count:", inputs.length);
		console.log("  - Collection items loaded:", !!collectionItems);
		
		if (inputs.length !== 10) {
			console.log("  ⚠️ Need exactly 10 inputs");
			return { outcomes: [], stats: null };
		}

		// Check if collection items are loaded
		if (!collectionItems) {
			console.log("  ⚠️ Collection items not loaded yet");
			return {
				outcomes: [],
				stats: {
					error: "Loading collection data...",
				},
			};
		}

		// Check if all inputs are same rarity
		const rarities = new Set(inputs.map((i) => i.rarity));
		console.log("  - Input rarities:", Array.from(rarities));
		
		if (rarities.size > 1) {
			console.log("  ❌ Mixed rarities detected!");
			return {
				outcomes: [],
				stats: {
					error: "All input skins must be the same rarity",
				},
			};
		}

		const currentRarity = inputs[0].rarity;
		const nextRarity = getNextRarity(currentRarity);
		console.log("  - Current rarity:", currentRarity);
		console.log("  - Next rarity:", nextRarity);

		if (!nextRarity) {
			console.log("  ❌ Cannot trade up from this rarity");
			return {
				outcomes: [],
				stats: {
					error: "Cannot trade up from Covert rarity",
				},
			};
		}

		// Group inputs by collection to calculate probabilities
		const collectionCounts: Record<string, number> = {};
		inputs.forEach((item) => {
			const collection = item.collection || "Unknown";
			collectionCounts[collection] =
				(collectionCounts[collection] || 0) + 1;
		});
		console.log("  - Collection counts:", collectionCounts);

		// Get all possible outcome items from collection items database
		const allPossibleOutcomes: PredictedOutcome[] = [];

		Object.entries(collectionCounts).forEach(([collection, count]) => {
			// Get items from this collection at the next rarity tier
			const collectionData = collectionItems[collection];
			console.log(`  - Looking for collection: "${collection}"`);
			
			if (!collectionData) {
				console.warn(`  ⚠️ Collection not found in database: "${collection}"`);
				console.log(`  💡 Available collections:`, Object.keys(collectionItems).slice(0, 5));
				return;
			}
			
			if (!collectionData[nextRarity]) {
				console.warn(`  ⚠️ No ${nextRarity} items in "${collection}"`);
				console.log(`  💡 Available rarities:`, Object.keys(collectionData));
				return;
			}

			const possibleItems = collectionData[nextRarity];
			const probability = count / inputs.length;
			console.log(`  ✅ Found ${possibleItems.length} items in "${collection}" (${(probability*100).toFixed(1)}% chance)`);

			// For each possible item, create an outcome for each exterior
			possibleItems.forEach((itemBaseName) => {
				// Generate outcomes for all exteriors
				const exteriors = [
					"Factory New",
					"Minimal Wear",
					"Field-Tested",
					"Well-Worn",
					"Battle-Scarred",
				];

				exteriors.forEach((exterior) => {
					const marketHashName = `${itemBaseName} (${exterior})`;

					// Try to find this item in user's inventory for image
					const inventoryItem = allInventory.find(
						(inv) => inv.marketHashName === marketHashName
					);

					// Get price from prices object
					const price = prices[marketHashName]?.price || 0;

					allPossibleOutcomes.push({
						name: itemBaseName,
						marketHashName,
						rarity: nextRarity,
						exterior,
						collection,
						probability: probability / exteriors.length, // Divide by number of exteriors
						estimatedPrice: price,
						minFloat: 0.0,
						maxFloat: 1.0,
						imageUrl:
							inventoryItem?.imageUrl ||
							`https://community.cloudflare.steamstatic.com/economy/image/default`,
					});
				});
			});
		});

		// Remove duplicates and group by base item
		const outcomeMap = new Map<string, PredictedOutcome>();
		allPossibleOutcomes.forEach((outcome) => {
			const key = outcome.marketHashName;
			if (!outcomeMap.has(key)) {
				outcomeMap.set(key, outcome);
			}
		});

		const calculatedOutcomes = Array.from(outcomeMap.values());
		console.log(`  🎉 Generated ${calculatedOutcomes.length} unique outcomes`);

		// Calculate total cost
		const totalCost = inputs.reduce((sum, item) => {
			const price = prices[item.marketHashName]?.price || item.price || 0;
			return sum + price;
		}, 0);

		// Calculate expected value
		const expectedValue = calculatedOutcomes.reduce((sum, outcome) => {
			return sum + outcome.estimatedPrice * outcome.probability;
		}, 0);

		const profit = expectedValue - totalCost;
		const profitability = totalCost > 0 ? (profit / totalCost) * 100 : 0;

		// Calculate odds to profit
		const profitableOutcomes = calculatedOutcomes.filter(
			(o) => o.estimatedPrice > totalCost
		);
		const oddsToProfit =
			profitableOutcomes.reduce((sum, o) => sum + o.probability, 0) * 100;

		return {
			outcomes: calculatedOutcomes.sort(
				(a, b) => b.probability - a.probability
			),
			stats: {
				totalCost,
				expectedValue,
				profit,
				profitability,
				oddsToProfit,
			},
		};
	}, [inputs, allInventory, prices, collectionItems]);

	// Auto-fetch prices for outcomes that don't have prices yet
	useEffect(() => {
		if (outcomes.length > 0) {
			// Find outcomes without prices
			const missingPrices = outcomes
				.filter((o) => !prices[o.marketHashName] || prices[o.marketHashName].price === 0)
				.map((o) => o.marketHashName);

			if (missingPrices.length > 0) {
				console.log(
					`🔍 Found ${missingPrices.length} outcomes without prices, fetching...`
				);
				fetchBatchPrices(missingPrices);
			}
		}
	}, [outcomes]);

	if (!stats || "error" in stats) {
		return (
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h3 className='text-lg font-semibold text-white mb-4'>
					Possible Outcomes
				</h3>
				<div className='text-center py-8'>
					<p className='text-red-400'>
						{stats?.error || "Add 10 skins to see outcomes"}
					</p>
				</div>
			</div>
		);
	}

	const isProfitable = stats.profit > 0;

	return (
		<div className='space-y-6'>
			{/* Stats Header */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-semibold text-white'>
						Trade-Up Statistics
					</h3>
					{isFetchingPrices && (
						<div className='flex items-center gap-2 text-sm text-blue-400'>
							<svg
								className='animate-spin h-4 w-4'
								viewBox='0 0 24 24'
							>
								<circle
									className='opacity-25'
									cx='12'
									cy='12'
									r='10'
									stroke='currentColor'
									strokeWidth='4'
									fill='none'
								/>
								<path
									className='opacity-75'
									fill='currentColor'
									d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
								/>
							</svg>
							Fetching prices...
						</div>
					)}
				</div>
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					<div className='bg-slate-700 rounded-lg p-4'>
						<div className='text-xs text-slate-400 mb-1'>
							Trade-Up Cost
						</div>
						<div className='text-2xl font-bold text-white'>
							${stats.totalCost.toFixed(2)}
						</div>
					</div>
					<div className='bg-slate-700 rounded-lg p-4'>
						<div className='text-xs text-slate-400 mb-1'>
							Expected Value
						</div>
						<div className='text-2xl font-bold text-white'>
							${stats.expectedValue.toFixed(2)}
						</div>
					</div>
					<div className='bg-slate-700 rounded-lg p-4'>
						<div className='text-xs text-slate-400 mb-1'>
							Profit/Loss
						</div>
						<div
							className={`text-2xl font-bold ${
								isProfitable ? "text-green-400" : "text-red-400"
							}`}
						>
							{isProfitable ? "+" : ""}${stats.profit.toFixed(2)}
						</div>
					</div>
					<div className='bg-slate-700 rounded-lg p-4'>
						<div className='text-xs text-slate-400 mb-1'>
							Profitability
						</div>
						<div
							className={`text-2xl font-bold ${
								isProfitable ? "text-green-400" : "text-red-400"
							}`}
						>
							{stats.profitability.toFixed(1)}%
						</div>
					</div>
				</div>

				{/* Odds to profit */}
				<div className='mt-4 p-4 bg-slate-700 rounded-lg'>
					<div className='flex items-center justify-between'>
						<span className='text-sm text-slate-300'>
							Odds to Profit
						</span>
						<span className='text-lg font-bold text-white'>
							{stats.oddsToProfit.toFixed(1)}%
						</span>
					</div>
					<div className='mt-2 h-2 bg-slate-600 rounded-full overflow-hidden'>
						<div
							className='h-full bg-green-500 transition-all duration-500'
							style={{ width: `${stats.oddsToProfit}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Outcomes */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h3 className='text-lg font-semibold text-white mb-4'>
					Possible Outcomes ({outcomes.length})
				</h3>

				{outcomes.length === 0 ? (
					<div className='text-center py-8'>
						<p className='text-slate-400'>
							No possible outcomes found. Make sure your input
							skins are from collections with higher tier items.
						</p>
					</div>
				) : (
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
						{outcomes.map((outcome, idx) => {
							const profit =
								outcome.estimatedPrice - stats.totalCost;
							const isProfitableOutcome = profit > 0;

							return (
								<div
									key={`${outcome.marketHashName}-${idx}`}
									className={`bg-slate-700 rounded-lg border-2 ${
										isProfitableOutcome
											? "border-green-500"
											: "border-red-500/30"
									} overflow-hidden`}
								>
									{/* Probability badge */}
									<div className='absolute top-2 left-2 bg-slate-900/90 text-white text-xs font-bold px-2 py-0.5 rounded-md z-10'>
										{(outcome.probability * 100).toFixed(1)}
										%
									</div>

									{/* Image */}
									<div className='relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-4'>
										<img
											src={outcome.imageUrl}
											alt={outcome.name}
											className='w-full aspect-square object-contain'
										/>
									</div>

									{/* Info */}
									<div className='p-3 space-y-1'>
										<div className='text-xs font-semibold text-white leading-tight line-clamp-2 min-h-[2rem]'>
											{outcome.name}
										</div>
										<div className='text-xs text-slate-400'>
											{outcome.exterior}
										</div>
										<div className='text-sm font-bold text-green-400'>
											${outcome.estimatedPrice.toFixed(2)}
										</div>
										<div
											className={`text-xs font-semibold ${
												isProfitableOutcome
													? "text-green-400"
													: "text-red-400"
											}`}
										>
											{isProfitableOutcome ? "+" : ""}$
											{profit.toFixed(2)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
