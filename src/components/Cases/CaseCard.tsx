import { Case } from "../../store/slices/casesSlice";

interface CaseCardProps {
	case: Case;
	onClick: () => void;
}

export default function CaseCard({ case: caseData, onClick }: CaseCardProps) {
	const priceUSD = (caseData.priceCredits / 100).toFixed(2);
	const expectedValueUSD = caseData.expectedValue
		? (caseData.expectedValue / 100).toFixed(2)
		: "0.00";
	const houseEdge =
		typeof caseData.houseEdge === "number"
			? caseData.houseEdge
			: typeof caseData.houseEdge === "string"
			? parseFloat(caseData.houseEdge)
			: null;

	return (
		<div
			onClick={onClick}
			className='bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-all cursor-pointer group'
		>
			{/* Image */}
			<div className='relative aspect-video bg-slate-900 overflow-hidden'>
				{caseData.imageUrl ? (
					<img
						src={caseData.imageUrl}
						alt={caseData.title}
						className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
					/>
				) : (
					<div className='w-full h-full flex items-center justify-center'>
						<div className='text-6xl'>📦</div>
					</div>
				)}
				{caseData.isFeatured && (
					<div className='absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded'>
						FEATURED
					</div>
				)}
			</div>

			{/* Content */}
			<div className='p-4'>
				<h3 className='text-lg font-semibold text-white mb-2 truncate'>
					{caseData.title}
				</h3>

				<p className='text-slate-400 text-sm mb-4 line-clamp-2'>
					{caseData.description || "No description available"}
				</p>

				{/* Stats */}
				<div className='space-y-2 mb-4'>
					<div className='flex justify-between text-sm'>
						<span className='text-slate-400'>Price</span>
						<span className='text-white font-semibold'>
							${priceUSD}
						</span>
					</div>
					<div className='flex justify-between text-sm'>
						<span className='text-slate-400'>Expected Value</span>
						<span className='text-green-400 font-semibold'>
							${expectedValueUSD}
						</span>
					</div>
					{houseEdge !== null && !isNaN(houseEdge) && (
						<div className='flex justify-between text-sm'>
							<span className='text-slate-400'>House Edge</span>
							<span
								className={`font-semibold ${
									houseEdge > 30
										? "text-red-400"
										: houseEdge > 20
										? "text-yellow-400"
										: "text-green-400"
								}`}
							>
								{houseEdge.toFixed(1)}%
							</span>
						</div>
					)}
					<div className='flex justify-between text-sm'>
						<span className='text-slate-400'>Times Opened</span>
						<span className='text-white'>
							{caseData.timesOpened.toLocaleString()}
						</span>
					</div>
				</div>

				{/* Creator */}
				<div className='flex items-center gap-2 pt-3 border-t border-slate-700'>
					<img
						src={
							caseData.creator.avatarUrl ||
							"https://via.placeholder.com/32"
						}
						alt={caseData.creator.steamName}
						className='w-6 h-6 rounded-full'
					/>
					<span className='text-sm text-slate-400'>
						by{" "}
						<span className='text-white'>
							{caseData.creator.steamName}
						</span>
					</span>
				</div>

				{/* Collection Badge */}
				{caseData.collection && (
					<div className='mt-2'>
						<span className='inline-block bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded'>
							{caseData.collection.name}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
