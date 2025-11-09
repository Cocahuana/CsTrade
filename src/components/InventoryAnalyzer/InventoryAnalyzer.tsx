import { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import { useLazyGetInventoryWithProxyQuery } from "../../store/api/steamApi";
import {
	setInventory,
	setPrices,
	analyzeInventory as analyzeInventoryAction,
} from "../../store/slices/optimizerSlice";
import InventoryGrid from "./InventoryGrid";
import OptimalTradeUpsList from "./OptimalTradeUpsList";
import OptimizerSettings from "./OptimizerSettings";
import InventoryFilters, {
	type InventoryFilterState,
} from "./InventoryFilters";

export default function InventoryAnalyzer() {
	const dispatch = useDispatch<AppDispatch>();
	const [steamId, setSteamId] = useState("");
	const [filters, setFilters] = useState<InventoryFilterState>({
		rarities: [],
		exteriors: [],
		collections: [],
		statTrakOnly: false,
		nonStatTrakOnly: false,
		tradeableOnly: false,
		nonTradeableOnly: false,
		minFloat: 0,
		maxFloat: 1,
		minPrice: 0,
		maxPrice: 10000,
		searchText: "",
	});
	const [
		fetchInventory,
		{ isLoading: isLoadingInventory, error: inventoryError },
	] = useLazyGetInventoryWithProxyQuery();

	const { inventory, suggestions, isAnalyzing, error, settings, prices } =
		useSelector((state: RootState) => state.optimizer);

	// Ref to track if prices have been initially fetched
	const pricesFetchedRef = useRef(false);
	const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Function to fetch prices in batch using the backend endpoint
	const fetchBatchPrices = async (marketHashNames: string[]) => {
		try {
			console.log(
				`💰 Fetching prices for ${marketHashNames.length} items using batch endpoint...`
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
					`✅ Successfully fetched ${result.stats.fetched} prices (${result.stats.failed} failed)`
				);

				// Merge with existing prices
				dispatch(setPrices({ ...prices, ...result.data }));
				return result.data;
			}
		} catch (err) {
			console.error("Failed to fetch batch prices:", err);
		}
		return {};
	};

	const fetchSteamMarketPrices = async (items: any[], limit?: number) => {
		try {
			const uniqueMarketHashNames = [
				...new Set(items.map((item) => item.marketHashName)),
			];

			// Apply limit if specified
			const hashNamesToFetch = limit
				? uniqueMarketHashNames.slice(0, limit)
				: uniqueMarketHashNames;

			console.log(
				`💰 Fetching prices for ${
					hashNamesToFetch.length
				} items from Steam Market${
					limit ? ` (limit: ${limit})` : ""
				}...`
			);

			// Use batch endpoint instead of one-by-one requests
			await fetchBatchPrices(hashNamesToFetch);

			pricesFetchedRef.current = true;
		} catch (err) {
			console.error("Failed to fetch market prices:", err);
		}
	};

	// Debounced search handler - fetches prices for filtered items
	useEffect(() => {
		// Clear existing timer
		if (searchDebounceTimerRef.current) {
			clearTimeout(searchDebounceTimerRef.current);
		}

		// Only trigger if there's search text and we have inventory
		if (
			filters.searchText &&
			inventory.length > 0 &&
			pricesFetchedRef.current
		) {
			searchDebounceTimerRef.current = setTimeout(async () => {
				console.log(
					`🔍 Search detected: "${filters.searchText}" - fetching prices after 3s delay...`
				);

				// Filter items based on search
				const matchingItems = inventory.filter((item) =>
					item.name
						.toLowerCase()
						.includes(filters.searchText.toLowerCase())
				);

				// Fetch prices only for items that don't have prices yet
				const itemsNeedingPrices = matchingItems.filter(
					(item) => !prices[item.marketHashName]
				);

				if (itemsNeedingPrices.length > 0) {
					console.log(
						`   📦 Found ${itemsNeedingPrices.length} items needing prices`
					);

					// Use batch endpoint for better performance
					const hashNamesToFetch = itemsNeedingPrices.map(
						(item) => item.marketHashName
					);
					await fetchBatchPrices(hashNamesToFetch);
				} else {
					console.log(`   ✅ All matching items already have prices`);
				}
			}, 3000); // 3 second delay
		}

		// Cleanup
		return () => {
			if (searchDebounceTimerRef.current) {
				clearTimeout(searchDebounceTimerRef.current);
			}
		};
	}, [filters.searchText, inventory, prices, dispatch]);

	const handleFetchInventory = async () => {
		if (!steamId.trim()) {
			alert("Please enter a Steam ID or profile URL");
			return;
		}

		try {
			// Extract Steam ID from URL if needed
			let extractedId = steamId.trim();

			// Handle full inventory URL (https://steamcommunity.com/profiles/76561198358588609/inventory/#730)
			if (steamId.includes("inventory")) {
				const inventoryMatch = steamId.match(
					/profiles\/(\d+)\/inventory/
				);
				if (inventoryMatch) extractedId = inventoryMatch[1];
			}
			// Handle profile URL
			else if (steamId.includes("steamcommunity.com")) {
				const match = steamId.match(/profiles\/(\d+)/);
				if (match) extractedId = match[1];
				// Handle custom URLs
				else if (steamId.includes("/id/")) {
					alert(
						"Please use your Steam ID (numbers) instead of custom URL. You can find it in your profile URL."
					);
					return;
				}
			}

			console.log("Fetching inventory for Steam ID:", extractedId);
			const result = await fetchInventory(extractedId).unwrap();
			console.log("result: ", result);
			dispatch(setInventory(result));

			// Fetch prices from Steam Market - only first 10 items initially
			await fetchSteamMarketPrices(result, 10);
		} catch (err) {
			console.error("Failed to fetch inventory:", err);
		}
	};

	const handleAnalyze = async () => {
		if (inventory.length === 0) {
			alert("Please load your inventory first");
			return;
		}

		console.log(
			`💰 Analyzing with ${Object.keys(prices).length} prices available`
		);

		await dispatch(analyzeInventoryAction({ inventory, prices, settings }));
	};

	// Extract available filter options from inventory
	const availableRarities = useMemo(() => {
		return [...new Set(inventory.map((item) => item.rarity))];
	}, [inventory]);

	const availableExteriors = useMemo(() => {
		return [
			...new Set(
				inventory
					.map((item) => item.exterior)
					.filter((e): e is string => !!e)
			),
		];
	}, [inventory]);

	const availableCollections = useMemo(() => {
		return [
			...new Set(
				inventory
					.map((item) => item.collection)
					.filter((c): c is string => !!c)
			),
		];
	}, [inventory]);

	// Merge prices into inventory items
	const inventoryWithPrices = useMemo(() => {
		console.log(
			`💰 Merging prices: ${
				Object.keys(prices).length
			} prices available for ${inventory.length} items`
		);
		const itemsWithPrices = inventory.map((item) => {
			const priceData = prices[item.marketHashName];
			return {
				...item,
				price: priceData?.price || item.price || 0,
			};
		});
		const itemsWithActualPrices = itemsWithPrices.filter(
			(item) => item.price > 0
		);
		console.log(
			`   ✅ ${itemsWithActualPrices.length} items now have prices`
		);
		return itemsWithPrices;
	}, [inventory, prices]);

	console.log(inventory, suggestions, isAnalyzing, error, settings);
	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h2 className='text-3xl font-bold text-white mb-2'>
					INVENTORY ANALYZER
				</h2>
				<p className='text-slate-300'>
					Connect your Steam inventory and let AI find the most
					profitable trade-up combinations automatically.
				</p>
			</div>

			{/* Steam ID Input */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h3 className='text-xl font-bold text-white mb-4'>
					Connect Steam Inventory
				</h3>
				<div className='flex gap-4'>
					<div className='flex-1'>
						<input
							type='text'
							value={steamId}
							onChange={(e) => setSteamId(e.target.value)}
							placeholder='76561198358588609 or https://steamcommunity.com/profiles/76561198358588609'
							className='w-full bg-slate-700 text-white rounded px-4 py-2 border border-slate-600 focus:outline-none focus:border-blue-500'
						/>
						<p className='text-xs text-slate-400 mt-1'>
							Enter your Steam ID or paste your profile/inventory
							URL
						</p>
					</div>
					<button
						onClick={handleFetchInventory}
						disabled={isLoadingInventory}
						className='bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-2 rounded font-semibold transition-colors self-start'
					>
						{isLoadingInventory ? "Loading..." : "Load Inventory"}
					</button>
				</div>

				{inventoryError && (
					<div className='mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4'>
						<p className='text-red-400 font-semibold text-sm mb-2'>
							❌ Failed to load inventory
						</p>
						<p className='text-red-300 text-sm mb-3'>
							{typeof inventoryError === "object" &&
							"data" in inventoryError
								? String(inventoryError.data)
								: typeof inventoryError === "object" &&
								  "error" in inventoryError
								? String(inventoryError.error)
								: "Unknown error occurred"}
						</p>
						<div className='text-yellow-300 text-xs space-y-2'>
							<p className='font-semibold'>
								🔧 Troubleshooting steps:
							</p>
							<ul className='list-disc list-inside ml-2 space-y-1'>
								<li>
									<strong>
										Make sure the API server is running
									</strong>{" "}
									- Run{" "}
									<code className='bg-slate-700 px-1 rounded'>
										npm run dev
									</code>{" "}
									in the <code>api/</code> folder
								</li>
								<li>
									Your Steam profile must be set to{" "}
									<strong>PUBLIC</strong>
								</li>
								<li>
									Your inventory privacy must be set to{" "}
									<strong>PUBLIC</strong>
								</li>
								<li>
									Verify you have CS2 items in your inventory
								</li>
								<li>
									Check browser console (F12) for detailed
									logs
								</li>
							</ul>
							<p className='mt-2 text-blue-300 bg-blue-900/20 p-2 rounded'>
								<strong>📋 How to make profile public:</strong>
								<br />
								Steam → Profile → Edit Profile → Privacy
								Settings → Set "My profile" and "Game details"
								to <strong>PUBLIC</strong>
							</p>
						</div>
					</div>
				)}
				{inventory.length > 0 && (
					<div className='mt-4 flex items-center justify-between'>
						<p className='text-slate-300'>
							<span className='font-semibold text-white'>
								{inventory.length}
							</span>{" "}
							tradable items found
						</p>
						<button
							onClick={handleAnalyze}
							disabled={isAnalyzing}
							className='bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-6 py-2 rounded font-semibold transition-colors flex items-center gap-2'
						>
							{isAnalyzing ? (
								<>
									<svg
										className='animate-spin h-5 w-5'
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
									Analyzing...
								</>
							) : (
								<>
									<svg
										className='w-5 h-5'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
										/>
									</svg>
									Find Optimal Trade-Ups
								</>
							)}
						</button>
					</div>
				)}
			</div>

			{/* Settings */}
			{inventory.length > 0 && <OptimizerSettings />}

			{/* Error Display */}
			{error && (
				<div className='bg-red-900/20 border border-red-500/30 rounded-lg p-4'>
					<p className='text-red-300'>{error}</p>
				</div>
			)}

			{/* Results */}
			{suggestions.length > 0 && (
				<div className='space-y-6'>
					<OptimalTradeUpsList suggestions={suggestions} />
				</div>
			)}

			{/* Filters */}
			{inventory.length > 0 && suggestions.length === 0 && (
				<InventoryFilters
					filters={filters}
					onFiltersChange={setFilters}
					availableRarities={availableRarities}
					availableExteriors={availableExteriors}
					availableCollections={availableCollections}
				/>
			)}

			{/* Inventory Grid */}
			{inventory.length > 0 &&
				suggestions.length === 0 &&
				!isAnalyzing && (
					<InventoryGrid
						items={inventoryWithPrices}
						filters={filters}
					/>
				)}

			{/* Empty State */}
			{inventory.length === 0 && !isLoadingInventory && (
				<div className='bg-slate-800 rounded-lg p-12 border border-slate-700 text-center'>
					<svg
						className='w-20 h-20 mx-auto mb-4 text-slate-600'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={1.5}
							d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
						/>
					</svg>
					<h3 className='text-xl font-semibold text-white mb-2'>
						No Inventory Loaded
					</h3>
					<p className='text-slate-400'>
						Enter your Steam ID above to get started
					</p>
				</div>
			)}
		</div>
	);
}
