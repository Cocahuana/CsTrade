import type { OptimalTradeUp } from "../../types/optimizer";

interface OptimalTradeUpsListProps {
	suggestions: OptimalTradeUp[];
}

export default function OptimalTradeUpsList({
	suggestions,
}: OptimalTradeUpsListProps) {
	return (
		<div className='space-y-4'>
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h3 className='text-2xl font-bold text-white mb-2'>
					Optimal Trade-Up Suggestions
				</h3>
				<p className='text-slate-400 text-sm'>
					Found {suggestions.length} profitable trade-up
					{suggestions.length !== 1 ? "s" : ""} in your inventory
				</p>
			</div>

			{suggestions.map((suggestion, index) => (
				<div
					key={suggestion.id}
					className='bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors'
				>
					{/* Header */}
					<div className='flex items-start justify-between mb-4'>
						<div className='flex items-center gap-3'>
							<div className='bg-blue-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center'>
								#{index + 1}
							</div>
							<div>
								<h4 className='text-lg font-bold text-white'>
									Trade-Up Option {index + 1}
								</h4>
								<div className='flex items-center gap-3 mt-1'>
									<span
										className={`text-xs px-2 py-1 rounded ${getRiskBadgeColor(
											suggestion.stats.risk
										)}`}
									>
										{suggestion.stats.risk.toUpperCase()}{" "}
										RISK
									</span>
									<span className='text-xs text-slate-400'>
										{suggestion.stats.confidence.toFixed(0)}
										% confidence
									</span>
								</div>
							</div>
						</div>
						<div className='text-right'>
							<div className='text-2xl font-bold text-green-400'>
								+{suggestion.stats.profitability.toFixed(1)}%
							</div>
							<div className='text-xs text-slate-400'>
								Expected Profit
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
						<div className='bg-slate-700/50 rounded-lg p-3'>
							<div className='text-xs text-slate-400 mb-1'>
								Total Cost
							</div>
							<div className='text-lg font-semibold text-white'>
								${suggestion.stats.totalCost.toFixed(2)}
							</div>
						</div>
						<div className='bg-slate-700/50 rounded-lg p-3'>
							<div className='text-xs text-slate-400 mb-1'>
								Expected Value
							</div>
							<div className='text-lg font-semibold text-blue-400'>
								${suggestion.stats.expectedValue.toFixed(2)}
							</div>
						</div>
						<div className='bg-slate-700/50 rounded-lg p-3'>
							<div className='text-xs text-slate-400 mb-1'>
								Expected Profit
							</div>
							<div className='text-lg font-semibold text-green-400'>
								${suggestion.stats.expectedProfit.toFixed(2)}
							</div>
						</div>
						<div className='bg-slate-700/50 rounded-lg p-3'>
							<div className='text-xs text-slate-400 mb-1'>
								Odds to Profit
							</div>
							<div className='text-lg font-semibold text-yellow-400'>
								{suggestion.stats.oddsToProfit.toFixed(1)}%
							</div>
						</div>
					</div>

					{/* Input Items */}
					<div className='mb-6'>
						<h5 className='text-sm font-semibold text-slate-300 mb-3'>
							Input Skins (10):
						</h5>
						<div className='grid grid-cols-5 md:grid-cols-10 gap-2'>
							{suggestion.inputs.map((item, idx) => (
								<div
									key={`${item.assetId}-${idx}`}
									className='bg-slate-700 rounded p-2 border border-slate-600'
									title={item.name}
								>
									<img
										src={item.imageUrl}
										alt={item.name}
										className='w-full aspect-square object-contain'
									/>
								</div>
							))}
						</div>
					</div>

					{/* Possible Outcomes */}
					<div>
						<h5 className='text-sm font-semibold text-slate-300 mb-3'>
							Possible Outcomes:
						</h5>
						<div className='space-y-2'>
							{suggestion.outcomes.map((outcome, idx) => (
								<div
									key={`${outcome.marketHashName}-${idx}`}
									className='bg-slate-700/30 rounded-lg p-3 flex items-center justify-between'
								>
									<div className='flex items-center gap-3'>
										{outcome.imageUrl && (
											<img
												src={outcome.imageUrl}
												alt={outcome.name}
												className='w-12 h-12 object-contain'
											/>
										)}
										<div>
											<div className='text-white font-medium text-sm'>
												{outcome.name}
											</div>
											<div className='text-xs text-slate-400'>
												{outcome.collection}
											</div>
										</div>
									</div>
									<div className='text-right'>
										<div className='text-sm font-semibold text-blue-400'>
											{(
												outcome.probability * 100
											).toFixed(1)}
											%
										</div>
										<div className='text-xs text-green-400'>
											${outcome.estimatedPrice.toFixed(2)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Action Button */}
					<div className='mt-6 pt-6 border-t border-slate-700'>
						<button className='w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold transition-colors'>
							Use This Trade-Up in Calculator
						</button>
					</div>
				</div>
			))}
		</div>
	);
}

function getRiskBadgeColor(risk: string): string {
	switch (risk) {
		case "low":
			return "bg-green-900/30 text-green-400 border border-green-500/30";
		case "medium":
			return "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30";
		case "high":
			return "bg-red-900/30 text-red-400 border border-red-500/30";
		default:
			return "bg-slate-700 text-slate-300";
	}
}
