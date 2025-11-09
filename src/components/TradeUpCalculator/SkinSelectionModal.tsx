import { useState, useMemo } from "react";
import type { InventoryItem } from "../../types/steam";

interface SkinSelectionModalProps {
	inventory: InventoryItem[];
	selectedAssetIds: string[];
	onSelect: (skin: InventoryItem) => void;
	onClose: () => void;
}

export default function SkinSelectionModal({
	inventory,
	selectedAssetIds,
	onSelect,
	onClose,
}: SkinSelectionModalProps) {
	const [searchText, setSearchText] = useState("");
	const [selectedCollection, setSelectedCollection] = useState<string>("ALL");
	const [selectedExterior, setSelectedExterior] = useState<string | null>(
		null
	);

	// Get unique collections
	const collections = useMemo(() => {
		const unique = new Set(
			inventory.map((item) => item.collection).filter(Boolean)
		);
		return ["ALL", ...Array.from(unique).sort()];
	}, [inventory]);

	// Filter inventory and exclude already selected items
	const filteredInventory = useMemo(() => {
		return inventory.filter((item) => {
			// Exclude already selected items
			if (selectedAssetIds.includes(item.assetId)) {
				return false;
			}

			// Search filter
			if (
				searchText &&
				!item.name.toLowerCase().includes(searchText.toLowerCase())
			) {
				return false;
			}

			// Collection filter
			if (
				selectedCollection !== "ALL" &&
				item.collection !== selectedCollection
			) {
				return false;
			}

			// Exterior filter
			if (selectedExterior && item.exterior !== selectedExterior) {
				return false;
			}

			return true;
		});
	}, [inventory, searchText, selectedCollection, selectedExterior, selectedAssetIds]);

	// Group by rarity
	const groupedByRarity = useMemo(() => {
		const groups: Record<string, InventoryItem[]> = {};
		filteredInventory.forEach((item) => {
			if (!groups[item.rarity]) {
				groups[item.rarity] = [];
			}
			groups[item.rarity].push(item);
		});
		return groups;
	}, [filteredInventory]);

	const getRarityColor = (rarity: string): string => {
		if (rarity.includes("Consumer")) return "border-gray-500";
		if (rarity.includes("Industrial")) return "border-blue-400";
		if (rarity.includes("Mil-Spec")) return "border-blue-500";
		if (rarity.includes("Restricted")) return "border-purple-500";
		if (rarity.includes("Classified")) return "border-pink-500";
		if (rarity.includes("Covert")) return "border-red-500";
		return "border-gray-500";
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'>
			<div className='bg-slate-800 rounded-lg border border-slate-700 w-full max-w-7xl max-h-[90vh] flex flex-col'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-slate-700'>
					<div>
						<h2 className='text-2xl font-bold text-white'>
							SELECT SKIN
						</h2>
						<p className='text-sm text-slate-400 mt-1'>
							{filteredInventory.length} skin
							{filteredInventory.length !== 1 ? "s" : ""}{" "}
							available
						</p>
					</div>
					<button
						onClick={onClose}
						className='text-slate-400 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors'
					>
						✕
					</button>
				</div>

				{/* Filters */}
				<div className='p-6 border-b border-slate-700 space-y-4'>
					{/* Search */}
					<div>
						<label className='block text-sm font-semibold text-slate-300 mb-2'>
							Skin
						</label>
						<input
							type='text'
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							placeholder='Search a Skin'
							className='w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none'
						/>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{/* Collection */}
						<div>
							<label className='block text-sm font-semibold text-slate-300 mb-2'>
								Collection
							</label>
							<select
								value={selectedCollection}
								onChange={(e) =>
									setSelectedCollection(e.target.value)
								}
								className='w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none'
							>
								{collections.map((collection) => (
									<option key={collection} value={collection}>
										{collection}
									</option>
								))}
							</select>
						</div>

						{/* Condition/Exterior */}
						<div>
							<label className='block text-sm font-semibold text-slate-300 mb-2'>
								Condition
							</label>
							<div className='flex gap-2'>
								<button
									onClick={() => setSelectedExterior(null)}
									className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
										selectedExterior === null
											? "bg-cyan-500 text-white"
											: "bg-slate-700 text-slate-300 hover:bg-slate-600"
									}`}
								>
									ALL
								</button>
								{["FN", "MW", "FT", "WW", "BS"].map((ext) => {
									const fullExterior: string | undefined = {
										FN: "Factory New",
										MW: "Minimal Wear",
										FT: "Field-Tested",
										WW: "Well-Worn",
										BS: "Battle-Scarred",
									}[ext];

									return (
										<button
											key={ext}
											onClick={() =>
												setSelectedExterior(
													selectedExterior ===
														fullExterior
														? null
														: fullExterior || null
												)
											}
											className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
												selectedExterior ===
												fullExterior
													? "bg-cyan-500 text-white"
													: "bg-slate-700 text-slate-300 hover:bg-slate-600"
											}`}
										>
											{ext}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				{/* Skin Grid */}
				<div className='flex-1 overflow-y-auto p-6'>
					{filteredInventory.length === 0 ? (
						<div className='text-center py-12'>
							<p className='text-slate-400 text-lg'>
								No skins match your filters
							</p>
						</div>
					) : (
						<div className='space-y-6'>
							{Object.entries(groupedByRarity).map(
								([rarity, items]) => (
									<div key={rarity}>
										<h3 className='text-lg font-bold text-white mb-4'>
											{rarity} ({items.length})
										</h3>
										<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4'>
											{items.map((item, idx) => (
												<button
													key={`${item.assetId}-${idx}`}
													onClick={() =>
														onSelect(item)
													}
													className={`bg-slate-700 rounded-lg border-2 ${getRarityColor(
														item.rarity
													)} hover:border-yellow-400 overflow-hidden transition-all hover:scale-105 group`}
												>
													{/* Image */}
													<div className='bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-3'>
														<img
															src={item.imageUrl}
															alt={item.name}
															className='w-full aspect-square object-contain'
														/>
													</div>

													{/* Info */}
													<div className='p-2 space-y-1'>
														<div className='text-xs font-semibold text-white leading-tight line-clamp-2 min-h-[2rem]'>
															{item.name}
														</div>
														<div className='text-xs text-slate-400'>
															{item.exterior ||
																"N/A"}
														</div>
														{item.float !==
															undefined && (
															<div className='text-xs text-yellow-400 font-mono'>
																{item.float.toFixed(
																	4
																)}
															</div>
														)}
														<div className='text-sm font-bold text-green-400'>
															$
															{(
																item.price || 0
															).toFixed(2)}
														</div>
													</div>
												</button>
											))}
										</div>
									</div>
								)
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
