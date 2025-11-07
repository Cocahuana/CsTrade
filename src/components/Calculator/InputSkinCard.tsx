import type { InputSkin } from "../../types/calculator";

interface InputSkinCardProps {
	skin: InputSkin;
	index: number;
	onRemove: () => void;
}

export default function InputSkinCard({ skin, onRemove }: InputSkinCardProps) {
	return (
		<div className='bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors'>
			<div className='flex items-center justify-between'>
				<div className='flex-1'>
					<div className='flex items-center gap-2 mb-1'>
						{skin.statTrak && (
							<span className='text-xs font-bold text-orange-500 bg-orange-500/20 px-2 py-0.5 rounded'>
								ST™
							</span>
						)}
						<h4 className='text-white font-medium text-sm'>
							{skin.name}
						</h4>
					</div>
					<div className='flex items-center gap-3 text-xs text-slate-400'>
						<span
							className={`font-medium ${getRarityColor(
								skin.rarity
							)}`}
						>
							{skin.rarity}
						</span>
						<span>•</span>
						<span>{skin.exterior}</span>
						<span>•</span>
						<span>Float: {skin.float.toFixed(4)}</span>
					</div>
				</div>

				<div className='flex items-center gap-3'>
					<div className='text-right'>
						<div className='text-green-400 font-semibold'>
							${skin.price.toFixed(2)}
						</div>
					</div>

					<button
						onClick={onRemove}
						className='text-red-400 hover:text-red-300 transition-colors p-2'
						title='Remove skin'
					>
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
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}

function getRarityColor(rarity: InputSkin["rarity"]): string {
	const colors = {
		Consumer: "text-gray-400",
		Industrial: "text-blue-400",
		"Mil-Spec": "text-blue-500",
		Restricted: "text-purple-500",
		Classified: "text-pink-500",
		Covert: "text-red-500",
	};
	return colors[rarity] || "text-gray-400";
}
