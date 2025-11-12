import type { ItemWithPrices } from "../../store/api/itemsApi";

interface ItemCardProps {
	item: ItemWithPrices;
}

export default function ItemCard({ item }: ItemCardProps) {
	const { name, imageUrl, priceRange, collection } = item;
	const { normal, statTrak } = priceRange;

	// Format price display
	const formatPriceRange = (range: typeof normal) => {
		if (!range) return null;
		if (range.min === range.max) {
			return `$${range.min.toFixed(2)}`;
		}
		return `$${range.min.toFixed(2)} - $${range.max.toFixed(2)}`;
	};

	const normalPriceDisplay = formatPriceRange(normal);
	const statTrakPriceDisplay = formatPriceRange(statTrak);

	return (
		<div className='bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 overflow-hidden group'>
			{/* Image Section */}
			<div className='relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center min-h-[180px]'>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={name}
						className='w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110'
					/>
				) : (
					<div className='text-slate-600 text-6xl'>🔫</div>
				)}
			</div>

			{/* Content Section */}
			<div className='p-4 space-y-3'>
				{/* Item Name */}
				<h3
					className='text-white font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]'
					title={name}
				>
					{name}
				</h3>

				{/* Normal Price Range */}
				{normalPriceDisplay && (
					<div className='space-y-1'>
						<div className='flex items-center justify-between'>
							<span className='text-xs text-slate-400 uppercase tracking-wide'>
								Price
							</span>
							{normal && normal.count > 1 && (
								<span className='text-[10px] text-slate-500'>
									{normal.count} variants
								</span>
							)}
						</div>
						<div className='text-white font-bold text-base'>
							{normalPriceDisplay}
						</div>
					</div>
				)}

				{/* StatTrak Price Range */}
				{statTrakPriceDisplay && (
					<div className='space-y-1'>
						<div className='flex items-center justify-between'>
							<span className='text-xs text-orange-400 uppercase tracking-wide flex items-center gap-1'>
								<span className='font-bold'>ST™</span>
								<span>Price</span>
							</span>
							{statTrak && statTrak.count > 1 && (
								<span className='text-[10px] text-slate-500'>
									{statTrak.count} variants
								</span>
							)}
						</div>
						<div className='text-orange-400 font-bold text-base'>
							{statTrakPriceDisplay}
						</div>
					</div>
				)}

				{/* No Prices Available */}
				{!normalPriceDisplay && !statTrakPriceDisplay && (
					<div className='text-slate-500 text-sm italic py-2'>
						No prices available
					</div>
				)}

				{/* Collection */}
				{collection && (
					<div className='pt-3 border-t border-slate-700/50'>
						<div className='flex items-center gap-2'>
							<div className='flex-1 min-w-0'>
								<div className='text-xs text-slate-400 mb-0.5'>
									Collection
								</div>
								<div
									className='text-xs text-yellow-400 font-medium truncate'
									title={collection.name}
								>
									{collection.name}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
