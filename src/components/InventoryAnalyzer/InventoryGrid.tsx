import type { InventoryItem } from "../../types/steam";
import type { InventoryFilterState } from "./InventoryFilters";

interface InventoryGridProps {
	items: InventoryItem[];
	filters?: InventoryFilterState;
}

// Calculate average price per gun + exterior combination
function calculateAveragePrices(items: InventoryItem[]) {
	const groups: Record<
		string,
		{ total: number; count: number; items: InventoryItem[] }
	> = {};

	items.forEach((item) => {
		// Extract gun name without exterior (e.g., "AK-47 | Redline")
		const gunName = item.name;
		const exterior = item.exterior || "Unknown";
		const key = `${gunName}|${exterior}`;

		if (!groups[key]) {
			groups[key] = { total: 0, count: 0, items: [] };
		}

		const price = item.price || 0;
		groups[key].total += price;
		groups[key].count += 1;
		groups[key].items.push(item);
	});

	return Object.entries(groups).map(([key, data]) => {
		const [gunName, exterior] = key.split("|");
		return {
			gunName,
			exterior,
			averagePrice: data.count > 0 ? data.total / data.count : 0,
			count: data.count,
			items: data.items,
		};
	});
}

export default function InventoryGrid({ items, filters }: InventoryGridProps) {
	// Apply filters
	let filteredItems = items;

	if (filters) {
		filteredItems = items.filter((item) => {
			// Search text filter
			if (
				filters.searchText &&
				!item.name
					.toLowerCase()
					.includes(filters.searchText.toLowerCase())
			) {
				return false;
			}

			// Rarity filter
			if (
				filters.rarities.length > 0 &&
				!filters.rarities.some((r) => item.rarity.includes(r))
			) {
				return false;
			}

			// Exterior filter
			if (
				filters.exteriors.length > 0 &&
				(!item.exterior || !filters.exteriors.includes(item.exterior))
			) {
				return false;
			}

			// Collection filter
			if (
				filters.collections.length > 0 &&
				(!item.collection ||
					!filters.collections.includes(item.collection))
			) {
				return false;
			}

			// StatTrak filter
			if (filters.statTrakOnly && !item.statTrak) {
				return false;
			}
			if (filters.nonStatTrakOnly && item.statTrak) {
				return false;
			}

			// Tradeable filter
			if (filters.tradeableOnly && !item.tradable) {
				return false;
			}
			if (filters.nonTradeableOnly && item.tradable) {
				return false;
			}

			// Float filter
			if (item.float !== undefined) {
				if (
					item.float < filters.minFloat ||
					item.float > filters.maxFloat
				) {
					return false;
				}
			}

			// Price filter
			const price = item.price || 0;
			if (price < filters.minPrice || price > filters.maxPrice) {
				return false;
			}

			return true;
		});
	}

	// Calculate average prices
	const averagePrices = calculateAveragePrices(filteredItems);

	// Group by rarity
	const groupedItems = filteredItems.reduce((acc, item) => {
		if (!acc[item.rarity]) acc[item.rarity] = [];
		acc[item.rarity].push(item);
		return acc;
	}, {} as Record<string, InventoryItem[]>);

	// Sort rarities by tier
	const rarityOrder = [
		"Covert",
		"Classified",
		"Restricted",
		"Mil-Spec",
		"Industrial",
		"Consumer",
	];
	const sortedRarities = Object.keys(groupedItems).sort((a, b) => {
		const indexA = rarityOrder.findIndex((r) => a.includes(r));
		const indexB = rarityOrder.findIndex((r) => b.includes(r));
		return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
	});

	return (
		<div className='space-y-6'>
			{/* Average Prices Section */}
			{averagePrices.length > 0 && (
				<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
					<h3 className='text-xl font-bold text-white mb-4 flex items-center gap-3'>
						<svg
							className='w-6 h-6 text-green-400'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
						</svg>
						Average Prices by Weapon & Exterior
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
						{averagePrices
							.sort((a, b) => b.averagePrice - a.averagePrice)
							.slice(0, 12)
							.map((priceInfo, index) => (
								<div
									key={index}
									className='bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-green-500/50 transition-colors'
								>
									<div className='flex items-start justify-between gap-2'>
										<div className='flex-1 min-w-0'>
											<div className='text-sm font-semibold text-white truncate'>
												{priceInfo.gunName}
											</div>
											<div className='text-xs text-slate-400 mt-0.5'>
												{priceInfo.exterior}
											</div>
										</div>
										<div className='text-right'>
											<div className='text-lg font-bold text-green-400'>
												$
												{priceInfo.averagePrice.toFixed(
													2
												)}
											</div>
											<div className='text-xs text-slate-500'>
												×{priceInfo.count}
											</div>
										</div>
									</div>
								</div>
							))}
					</div>
				</div>
			)}

			{/* Inventory Grid */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h3 className='text-2xl font-bold text-white mb-6 flex items-center gap-3'>
					<svg
						className='w-7 h-7 text-blue-400'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
						/>
					</svg>
					Your Inventory
					<span className='text-lg text-slate-400 font-normal'>
						({filteredItems.length} items
						{filters &&
							filteredItems.length !== items.length &&
							` of ${items.length}`}
						)
					</span>
				</h3>

				<div className='space-y-8'>
					{sortedRarities.map((rarity) => {
						const rarityItems = groupedItems[rarity];
						return (
							<div key={rarity}>
								<div className='flex items-center gap-3 mb-4'>
									<div
										className={`h-1 w-12 rounded-full ${getRarityGradient(
											rarity
										)}`}
									/>
									<h4
										className={`text-base font-bold ${getRarityColor(
											rarity
										)}`}
									>
										{rarity}
									</h4>
									<span className='text-sm text-slate-500'>
										({rarityItems.length})
									</span>
								</div>
								<div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4'>
									{rarityItems.map((item) => (
										<div
											key={item.assetId}
											className='group relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl'
											style={{
												borderColor:
													getRarityBorderColor(
														item.rarity
													),
												boxShadow: `0 0 20px -5px ${getRarityBorderColor(
													item.rarity
												)}40`,
											}}
										>
											{/* Rarity Glow Effect */}
											<div
												className='absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300'
												style={{
													background: `radial-gradient(circle at center, ${getRarityBorderColor(
														item.rarity
													)}, transparent 70%)`,
												}}
											/>

											{/* Image Container */}
											<div className='relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-4'>
												<img
													src={item.imageUrl}
													alt={item.name}
													className='w-full aspect-square object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110'
												/>
												{item.statTrak && (
													<div className='absolute top-2 right-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg'>
														ST™
													</div>
												)}
												{item.tradeableAfterDays &&
													item.tradeableAfterDays >
														0 && (
														<div className='absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1'>
															🔒{" "}
															{
																item.tradeableAfterDays
															}
															d
														</div>
													)}
											</div>

											{/* Info Container */}
											<div className='p-3 space-y-1.5'>
												{/* Name */}
												<div
													className='text-xs font-semibold text-white leading-tight line-clamp-2 min-h-[2.5rem]'
													title={item.name}
												>
													{item.name}
												</div>

												{/* Exterior */}
												{item.exterior && (
													<div className='flex items-center gap-1'>
														<div className='w-1.5 h-1.5 rounded-full bg-slate-500' />
														<span className='text-[10px] text-slate-400 uppercase tracking-wide'>
															{item.exterior}
														</span>
													</div>
												)}

												{/* Float Value */}
												{item.float !== undefined && (
													<div className='flex items-center gap-1 bg-slate-900/50 rounded px-2 py-1'>
														<svg
															className='w-3 h-3 text-cyan-400'
															fill='currentColor'
															viewBox='0 0 20 20'
														>
															<path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
															<path
																fillRule='evenodd'
																d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
																clipRule='evenodd'
															/>
														</svg>
														<span className='text-[10px] text-cyan-300 font-mono font-semibold'>
															{item.float.toFixed(
																6
															)}
														</span>
													</div>
												)}

												{/* Collection */}
												{item.collection && (
													<div className='flex items-center gap-1'>
														<svg
															className='w-3 h-3 text-yellow-400'
															fill='currentColor'
															viewBox='0 0 20 20'
														>
															<path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
														</svg>
														<span className='text-[10px] text-yellow-300 truncate'>
															{item.collection}
														</span>
													</div>
												)}

												{/* Price */}
												{item.price !== undefined &&
													item.price > 0 && (
														<div className='flex items-center justify-between pt-1.5 border-t border-slate-700/50'>
															<span className='text-xs text-green-400 font-bold'>
																$
																{item.price.toFixed(
																	2
																)}
															</span>
															<button className='text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors'>
																Use →
															</button>
														</div>
													)}
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function getRarityColor(rarity: string): string {
	if (rarity.includes("Consumer")) return "text-gray-400";
	if (rarity.includes("Industrial")) return "text-blue-400";
	if (rarity.includes("Mil-Spec")) return "text-blue-500";
	if (rarity.includes("Restricted")) return "text-purple-400";
	if (rarity.includes("Classified")) return "text-pink-400";
	if (rarity.includes("Covert")) return "text-red-400";
	return "text-gray-400";
}

function getRarityBorderColor(rarity: string): string {
	if (rarity.includes("Consumer")) return "#9ca3af";
	if (rarity.includes("Industrial")) return "#5e98d9";
	if (rarity.includes("Mil-Spec")) return "#4b69ff";
	if (rarity.includes("Restricted")) return "#8847ff";
	if (rarity.includes("Classified")) return "#d32ce6";
	if (rarity.includes("Covert")) return "#eb4b4b";
	return "#6b7280";
}

function getRarityGradient(rarity: string): string {
	if (rarity.includes("Consumer"))
		return "bg-gradient-to-r from-gray-500 to-gray-400";
	if (rarity.includes("Industrial"))
		return "bg-gradient-to-r from-blue-600 to-blue-400";
	if (rarity.includes("Mil-Spec"))
		return "bg-gradient-to-r from-blue-700 to-blue-500";
	if (rarity.includes("Restricted"))
		return "bg-gradient-to-r from-purple-600 to-purple-400";
	if (rarity.includes("Classified"))
		return "bg-gradient-to-r from-pink-600 to-pink-400";
	if (rarity.includes("Covert"))
		return "bg-gradient-to-r from-red-600 to-red-400";
	return "bg-gradient-to-r from-gray-600 to-gray-400";
}
