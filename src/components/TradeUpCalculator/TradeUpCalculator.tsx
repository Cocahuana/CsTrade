import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { InventoryItem } from "../../types/steam";
import SkinSelectionModal from "./SkinSelectionModal";
import OutcomesPanel from "./OutcomesPanel";

export default function TradeUpCalculator() {
	const { inventory, prices } = useSelector(
		(state: RootState) => state.optimizer
	);
	const [selectedSlots, setSelectedSlots] = useState<
		(InventoryItem | null)[]
	>(Array(10).fill(null));
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
		null
	);

	// Merge prices into inventory
	const inventoryWithPrices = useMemo(() => {
		return inventory.map((item: InventoryItem) => {
			const priceData = prices[item.marketHashName];
			return {
				...item,
				price: priceData?.price || item.price || 0,
			};
		});
	}, [inventory, prices]);

	// Get already selected asset IDs to prevent duplicates
	const selectedAssetIds = useMemo(() => {
		return selectedSlots
			.filter((slot): slot is InventoryItem => slot !== null)
			.map((slot) => slot.assetId);
	}, [selectedSlots]);

	const handleSlotClick = (index: number) => {
		setSelectedSlotIndex(index);
		setIsModalOpen(true);
	};

	const handleSkinSelect = (skin: InventoryItem) => {
		if (selectedSlotIndex !== null) {
			const newSlots = [...selectedSlots];
			newSlots[selectedSlotIndex] = skin;
			setSelectedSlots(newSlots);
		}
		setIsModalOpen(false);
		setSelectedSlotIndex(null);
	};

	const handleRemoveSkin = (index: number) => {
		const newSlots = [...selectedSlots];
		newSlots[index] = null;
		setSelectedSlots(newSlots);
	};

	const filledSlotsCount = selectedSlots.filter(
		(slot) => slot !== null
	).length;
	const canCalculate = filledSlotsCount === 10;

	// Check if inventory is loaded
	const hasInventory = inventory.length > 0;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h2 className='text-2xl font-bold text-white mb-2'>
					Trade-Up Calculator
				</h2>
				<p className='text-slate-300'>
					Manually select 10 skins to calculate possible trade-up
					outcomes
				</p>
			</div>

			{/* Warning if no inventory */}
			{!hasInventory && (
				<div className='bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6'>
					<div className='flex items-start gap-3'>
						<svg
							className='w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
							/>
						</svg>
						<div>
							<h3 className='text-lg font-semibold text-yellow-500 mb-2'>
								No Inventory Loaded
							</h3>
							<p className='text-slate-300 mb-3'>
								You need to load your Steam inventory first
								before you can use the Trade-Up Calculator.
							</p>
							<p className='text-sm text-slate-400'>
								💡 Go to the{" "}
								<strong className='text-white'>
									Inventory Analyzer
								</strong>{" "}
								tab and load your Steam inventory. Then come
								back here to build your trade-up!
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Input Slots */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-semibold text-white'>
						Input Skins ({filledSlotsCount}/10)
					</h3>
					{filledSlotsCount > 0 && (
						<button
							onClick={() =>
								setSelectedSlots(Array(10).fill(null))
							}
							className='text-sm text-red-400 hover:text-red-300'
						>
							Clear All
						</button>
					)}
				</div>

				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-4'>
					{selectedSlots.map((slot, index) => (
						<div key={index} className='relative group'>
							{slot ? (
								// Filled slot
								<div className='bg-slate-700 rounded-lg border-2 border-yellow-500/50 overflow-hidden hover:border-yellow-500 transition-colors'>
									{/* Float badge */}
									<div className='absolute top-2 left-2 bg-slate-900/90 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-md z-10'>
										{slot.float?.toFixed(4) || "N/A"}
									</div>

									{/* Remove button */}
									<button
										onClick={() => handleRemoveSkin(index)}
										className='absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity'
										title='Remove'
									>
										✕
									</button>

									{/* Image */}
									<div className='bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-4'>
										<img
											src={slot.imageUrl}
											alt={slot.name}
											className='w-full aspect-square object-contain'
										/>
									</div>

									{/* Info */}
									<div className='p-3 space-y-1'>
										<div className='text-xs font-semibold text-white leading-tight line-clamp-2 min-h-[2rem]'>
											{slot.name}
										</div>
										<div className='text-xs text-slate-400'>
											{slot.exterior || "N/A"}
										</div>
										<div className='text-sm font-bold text-green-400'>
											${(slot.price || 0).toFixed(2)}
										</div>
									</div>
								</div>
							) : (
								// Empty slot
								<button
									onClick={() => handleSlotClick(index)}
									disabled={!hasInventory}
									className={`w-full aspect-[3/4] rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group ${
										hasInventory
											? "bg-slate-700/50 border-slate-600 hover:border-green-500 hover:bg-slate-700 cursor-pointer"
											: "bg-slate-800/50 border-slate-700 cursor-not-allowed opacity-50"
									}`}
								>
									<div
										className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
											hasInventory
												? "border-slate-600 group-hover:border-green-500"
												: "border-slate-700"
										}`}
									>
										<svg
											className={`w-6 h-6 transition-colors ${
												hasInventory
													? "text-slate-600 group-hover:text-green-500"
													: "text-slate-700"
											}`}
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M12 4v16m8-8H4'
											/>
										</svg>
									</div>
									<span
										className={`text-xs transition-colors ${
											hasInventory
												? "text-slate-500 group-hover:text-green-400"
												: "text-slate-700"
										}`}
									>
										{hasInventory
											? "Add Skin"
											: "Load Inventory"}
									</span>
								</button>
							)}
						</div>
					))}
				</div>

				{/* Info message */}
				{!canCalculate && filledSlotsCount > 0 && (
					<div className='mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg'>
						<p className='text-sm text-blue-300'>
							ℹ️ Add {10 - filledSlotsCount} more skin
							{10 - filledSlotsCount !== 1 ? "s" : ""} to
							calculate trade-up outcomes
						</p>
					</div>
				)}
			</div>

			{/* Outcomes Panel */}
			{canCalculate && (
				<OutcomesPanel
					inputs={selectedSlots.filter(
						(s): s is InventoryItem => s !== null
					)}
					allInventory={inventoryWithPrices}
					prices={prices}
				/>
			)}

			{/* Skin Selection Modal */}
			{isModalOpen && (
				<SkinSelectionModal
					inventory={inventoryWithPrices}
					selectedAssetIds={selectedAssetIds}
					onSelect={handleSkinSelect}
					onClose={() => {
						setIsModalOpen(false);
						setSelectedSlotIndex(null);
					}}
				/>
			)}
		</div>
	);
}
