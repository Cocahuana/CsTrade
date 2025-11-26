import { useState } from "react";

export interface InventoryFilterState {
	rarities: string[];
	exteriors: string[];
	collections: string[];
	statTrakOnly: boolean;
	nonStatTrakOnly: boolean;
	tradeableOnly: boolean;
	nonTradeableOnly: boolean;
	minFloat: number;
	maxFloat: number;
	minPrice: number;
	maxPrice: number;
	searchText: string;
	showProtectedItems: boolean;
	sortBy: string;
	sortOrder: "asc" | "desc";
}

interface InventoryFiltersProps {
	filters: InventoryFilterState;
	onFiltersChange: (filters: InventoryFilterState) => void;
	availableRarities: string[];
	availableExteriors: string[];
	availableCollections: string[];
}

export default function InventoryFilters({
	filters,
	onFiltersChange,
	availableRarities,
	availableExteriors,
	availableCollections,
}: InventoryFiltersProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const toggleRarity = (rarity: string) => {
		const newRarities = filters.rarities.includes(rarity)
			? filters.rarities.filter((r) => r !== rarity)
			: [...filters.rarities, rarity];
		onFiltersChange({ ...filters, rarities: newRarities });
	};

	const toggleExterior = (exterior: string) => {
		const newExteriors = filters.exteriors.includes(exterior)
			? filters.exteriors.filter((e) => e !== exterior)
			: [...filters.exteriors, exterior];
		onFiltersChange({ ...filters, exteriors: newExteriors });
	};

	const toggleCollection = (collection: string) => {
		const newCollections = filters.collections.includes(collection)
			? filters.collections.filter((c) => c !== collection)
			: [...filters.collections, collection];
		onFiltersChange({ ...filters, collections: newCollections });
	};

	const resetFilters = () => {
		onFiltersChange({
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
			showProtectedItems: true,
			sortBy: "date",
			sortOrder: "desc",
		});
	};

	const getRarityColor = (rarity: string): string => {
		if (rarity.includes("Consumer")) return "bg-gray-500";
		if (rarity.includes("Industrial")) return "bg-blue-400";
		if (rarity.includes("Mil-Spec")) return "bg-blue-500";
		if (rarity.includes("Restricted")) return "bg-purple-500";
		if (rarity.includes("Classified")) return "bg-pink-500";
		if (rarity.includes("Covert")) return "bg-red-500";
		return "bg-gray-500";
	};

	const activeFiltersCount =
		filters.rarities.length +
		filters.exteriors.length +
		filters.collections.length +
		(filters.statTrakOnly ? 1 : 0) +
		(filters.nonStatTrakOnly ? 1 : 0) +
		(filters.minFloat > 0 ? 1 : 0) +
		(filters.maxFloat < 1 ? 1 : 0) +
		(filters.minPrice > 0 ? 1 : 0) +
		(filters.maxPrice < 10000 ? 1 : 0) +
		(filters.searchText ? 1 : 0) +
		(!filters.showProtectedItems ? 1 : 0);

	// Standard rarity options
	const standardRarities = [
		"Consumer",
		"Industrial",
		"Mil-Spec",
		"Restricted",
		"Classified",
		"Covert",
	];

	const toggleStandardRarity = (rarity: string) => {
		const newRarities = filters.rarities.some((r) => r.includes(rarity))
			? filters.rarities.filter((r) => !r.includes(rarity))
			: [...filters.rarities, rarity];
		onFiltersChange({ ...filters, rarities: newRarities });
	};

	const isRaritySelected = (rarity: string) => {
		return filters.rarities.some((r) => r.includes(rarity));
	};

	return (
		<div className='bg-slate-800 rounded-lg border border-slate-700 overflow-hidden'>
			{/* Header */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className='w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors'
			>
				<div className='flex items-center gap-3'>
					<svg
						className='w-5 h-5 text-blue-400'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
						/>
					</svg>
					<h3 className='text-lg font-bold text-white'>Filters</h3>
					{activeFiltersCount > 0 && (
						<span className='bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full'>
							{activeFiltersCount}
						</span>
					)}
				</div>
				<svg
					className={`w-5 h-5 text-slate-400 transition-transform ${
						isExpanded ? "rotate-180" : ""
					}`}
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M19 9l-7 7-7-7'
					/>
				</svg>
			</button>

			{/* Filters Content */}
			{isExpanded && (
				<div className='p-4 pt-0 space-y-6 border-t border-slate-700'>
					{/* Search */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Search
						</label>
						<input
							type='text'
							value={filters.searchText}
							onChange={(e) =>
								onFiltersChange({
									...filters,
									searchText: e.target.value,
								})
							}
							placeholder='Search by weapon name...'
							className='w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500'
						/>
					</div>

					{/* Rarity Filter - Checkboxes */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-3'>
							Rarity
						</label>
						<div className='grid grid-cols-2 gap-2'>
							{standardRarities.map((rarity) => (
								<label
									key={rarity}
									className='flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-2 rounded transition-colors'
								>
									<input
										type='checkbox'
										checked={isRaritySelected(rarity)}
										onChange={() =>
											toggleStandardRarity(rarity)
										}
										className='w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500'
									/>
									<span
										className={`text-sm font-medium ${
											isRaritySelected(rarity)
												? "text-white"
												: "text-slate-300"
										}`}
									>
										{rarity}
									</span>
								</label>
							))}
						</div>
					</div>

					{/* Sorting Options */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Sort By
						</label>
						<div className='flex gap-2'>
							<select
								value={filters.sortBy}
								onChange={(e) =>
									onFiltersChange({
										...filters,
										sortBy: e.target.value,
									})
								}
								className='flex-1 bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500'
							>
								<option value='date'>Date</option>
								<option value='rarity'>Rarity</option>
								<option value='price'>Price</option>
								<option value='float'>Float</option>
							</select>
							<button
								onClick={() =>
									onFiltersChange({
										...filters,
										sortOrder:
											filters.sortOrder === "asc"
												? "desc"
												: "asc",
									})
								}
								className='bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm border border-slate-600 transition-colors'
								title={
									filters.sortOrder === "asc"
										? "Lowest to Highest"
										: "Highest to Lowest"
								}
							>
								{filters.sortOrder === "asc" ? "↑" : "↓"}
							</button>
						</div>
						<p className='text-xs text-slate-400 mt-1'>
							{filters.sortOrder === "asc"
								? "Lowest to Highest"
								: "Highest to Lowest"}
						</p>
					</div>

					{/* Show Protected Items */}
					<div>
						<label className='flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-2 rounded transition-colors'>
							<input
								type='checkbox'
								checked={filters.showProtectedItems}
								onChange={(e) =>
									onFiltersChange({
										...filters,
										showProtectedItems: e.target.checked,
									})
								}
								className='w-4 h-4 rounded border-slate-600 text-yellow-600 focus:ring-yellow-500'
							/>
							<span className='text-sm text-slate-300'>
								Show Protected Items
							</span>
						</label>
					</div>

					{/* Exterior Filter */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Exterior
						</label>
						<div className='flex flex-wrap gap-2'>
							{availableExteriors.map((exterior) => (
								<button
									key={exterior}
									onClick={() => toggleExterior(exterior)}
									className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
										filters.exteriors.includes(exterior)
											? "bg-green-600 text-white shadow-lg"
											: "bg-slate-700 text-slate-300 hover:bg-slate-600"
									}`}
								>
									{exterior}
								</button>
							))}
						</div>
					</div>

					{/* Collections Filter */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Collections
						</label>
						<div className='flex flex-wrap gap-2 max-h-32 overflow-y-auto'>
							{availableCollections.map((collection) => (
								<button
									key={collection}
									onClick={() => toggleCollection(collection)}
									className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
										filters.collections.includes(collection)
											? "bg-yellow-600 text-white shadow-lg"
											: "bg-slate-700 text-slate-300 hover:bg-slate-600"
									}`}
								>
									{collection}
								</button>
							))}
						</div>
					</div>

					{/* StatTrak Filter */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							StatTrak™
						</label>
						<div className='flex gap-3'>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='checkbox'
									checked={filters.statTrakOnly}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											statTrakOnly: e.target.checked,
											nonStatTrakOnly: e.target.checked
												? false
												: filters.nonStatTrakOnly,
										})
									}
									className='w-4 h-4 rounded border-slate-600 text-orange-600 focus:ring-orange-500'
								/>
								<span className='text-sm text-slate-300'>
									StatTrak™ Only
								</span>
							</label>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='checkbox'
									checked={filters.nonStatTrakOnly}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											nonStatTrakOnly: e.target.checked,
											statTrakOnly: e.target.checked
												? false
												: filters.statTrakOnly,
										})
									}
									className='w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm text-slate-300'>
									Non-StatTrak™ Only
								</span>
							</label>
						</div>
					</div>

					{/* Tradeable Status */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Tradeable Status
						</label>
						<div className='flex gap-3'>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='checkbox'
									checked={filters.tradeableOnly}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											tradeableOnly: e.target.checked,
											nonTradeableOnly: e.target.checked
												? false
												: filters.nonTradeableOnly,
										})
									}
									className='w-4 h-4 rounded border-slate-600 text-green-600 focus:ring-green-500'
								/>
								<span className='text-sm text-slate-300'>
									Tradeable Only
								</span>
							</label>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='checkbox'
									checked={filters.nonTradeableOnly}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											nonTradeableOnly: e.target.checked,
											tradeableOnly: e.target.checked
												? false
												: filters.tradeableOnly,
										})
									}
									className='w-4 h-4 rounded border-slate-600 text-red-600 focus:ring-red-500'
								/>
								<span className='text-sm text-slate-300'>
									Non-Tradeable Only
								</span>
							</label>
						</div>
					</div>

					{/* Float Range */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Float Range
						</label>
						<div className='flex gap-3 items-center'>
							<div className='flex-1'>
								<input
									type='number'
									value={filters.minFloat}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											minFloat: parseFloat(
												e.target.value
											),
										})
									}
									min='0'
									max='1'
									step='0.01'
									placeholder='Min'
									className='w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500'
								/>
							</div>
							<span className='text-slate-500'>-</span>
							<div className='flex-1'>
								<input
									type='number'
									value={filters.maxFloat}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											maxFloat: parseFloat(
												e.target.value
											),
										})
									}
									min='0'
									max='1'
									step='0.01'
									placeholder='Max'
									className='w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500'
								/>
							</div>
						</div>
					</div>

					{/* Price Range */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Price Range ($)
						</label>
						<div className='flex gap-3 items-center'>
							<div className='flex-1'>
								<input
									type='number'
									value={filters.minPrice}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											minPrice: parseFloat(
												e.target.value
											),
										})
									}
									min='0'
									step='0.01'
									placeholder='Min'
									className='w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500'
								/>
							</div>
							<span className='text-slate-500'>-</span>
							<div className='flex-1'>
								<input
									type='number'
									value={filters.maxPrice}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											maxPrice: parseFloat(
												e.target.value
											),
										})
									}
									min='0'
									step='0.01'
									placeholder='Max'
									className='w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500'
								/>
							</div>
						</div>
					</div>

					{/* Reset Button */}
					{activeFiltersCount > 0 && (
						<button
							onClick={resetFilters}
							className='w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-semibold transition-colors text-sm flex items-center justify-center gap-2'
						>
							<svg
								className='w-4 h-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
								/>
							</svg>
							Reset All Filters
						</button>
					)}
				</div>
			)}
		</div>
	);
}
