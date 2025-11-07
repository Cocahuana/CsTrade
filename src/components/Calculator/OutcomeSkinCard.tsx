import type { OutcomeSkin } from "../../types/calculator";

interface OutcomeSkinCardProps {
	skin: OutcomeSkin;
}

export default function OutcomeSkinCard({ skin }: OutcomeSkinCardProps) {
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
						<span>
							Float: {skin.minFloat.toFixed(4)} -{" "}
							{skin.maxFloat.toFixed(4)}
						</span>
					</div>
				</div>

				<div className='flex items-center gap-4'>
					<div className='text-center'>
						<div className='text-xs text-slate-400 mb-0.5'>
							Probability
						</div>
						<div className='text-blue-400 font-semibold'>
							{(skin.probability * 100).toFixed(2)}%
						</div>
					</div>

					<div className='text-right'>
						<div className='text-xs text-slate-400 mb-0.5'>
							Price
						</div>
						<div className='text-green-400 font-semibold'>
							${skin.price.toFixed(2)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function getRarityColor(rarity: OutcomeSkin["rarity"]): string {
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
