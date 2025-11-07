import { useState } from "react";
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

export default function InventoryAnalyzer() {
	const dispatch = useDispatch<AppDispatch>();
	const [steamId, setSteamId] = useState("");
	const [
		fetchInventory,
		{ isLoading: isLoadingInventory, error: inventoryError },
	] = useLazyGetInventoryWithProxyQuery();

	const { inventory, suggestions, isAnalyzing, error, settings } =
		useSelector((state: RootState) => state.optimizer);

	const fetchSteamMarketPrices = async (items: any[]) => {
		try {
			const priceMap: Record<string, any> = {};
			const uniqueMarketHashNames = [
				...new Set(items.map((item) => item.marketHashName)),
			];

			console.log(
				`💰 Fetching prices for ${uniqueMarketHashNames.length} unique items from Steam Market...`
			);

			// Fetch prices with delay to avoid rate limiting
			for (const marketHashName of uniqueMarketHashNames) {
				try {
					const response = await fetch(
						`http://localhost:5000/api/steam/market/price/${encodeURIComponent(
							marketHashName
						)}`
					);

					if (response.ok) {
						const result = await response.json();
						if (result.success && result.data) {
							// Parse price from string like "$1.23" to number 1.23
							const lowestPrice = result.data.lowest_price
								? parseFloat(
										result.data.lowest_price.replace(
											/[$,]/g,
											""
										)
								  )
								: 0;
							const medianPrice = result.data.median_price
								? parseFloat(
										result.data.median_price.replace(
											/[$,]/g,
											""
										)
								  )
								: 0;

							priceMap[marketHashName] = {
								marketHashName,
								price: lowestPrice || medianPrice,
								lowestPrice,
								medianPrice,
								volume: result.data.volume || 0,
								source: "steam" as const,
								timestamp: Date.now(),
							};
						}
					}

					// Rate limiting: wait 1.5 seconds between requests to avoid Steam blocking
					await new Promise((resolve) => setTimeout(resolve, 1500));
				} catch (err) {
					console.warn(
						`⚠️ Failed to fetch price for ${marketHashName}:`,
						err
					);
				}
			}

			console.log(
				`✅ Successfully fetched prices for ${
					Object.keys(priceMap).length
				} items`
			);
			dispatch(setPrices(priceMap));
		} catch (err) {
			console.error("Failed to fetch market prices:", err);
		}
	};

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

			// Fetch prices from Steam Market for each unique item
			await fetchSteamMarketPrices(result);
		} catch (err) {
			console.error("Failed to fetch inventory:", err);
		}
	};

	const handleAnalyze = async () => {
		if (inventory.length === 0) {
			alert("Please load your inventory first");
			return;
		}

		await dispatch(
			analyzeInventoryAction({ inventory, prices: {}, settings })
		);
	};
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

			{/* Inventory Grid */}
			{inventory.length > 0 &&
				suggestions.length === 0 &&
				!isAnalyzing && <InventoryGrid items={inventory} />}

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
