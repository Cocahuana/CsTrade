import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import OutcomeSkinCard from "./OutcomeSkinCard";

export default function OutcomesSection() {
	const {
		outcomes,
		averageFloat,
		adjustedAverageFloat,
		tradeUpCost,
		profitability,
		profitPerTradeUp,
		oddsToProfit,
		inputs,
	} = useSelector((state: RootState) => state.calculator);

	const hasInputs = inputs.length > 0;

	return (
		<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
			<h3 className='text-xl font-bold text-white mb-4'>OUTCOMES</h3>

			{/* Statistics */}
			<div className='grid grid-cols-2 gap-4 mb-6'>
				<div className='bg-slate-700/50 rounded-lg p-3'>
					<div className='text-xs text-slate-400 mb-1'>
						AVG. FLOAT
					</div>
					<div className='text-lg font-semibold text-white'>
						{hasInputs ? averageFloat.toFixed(4) : "0.00"}
					</div>
				</div>

				<div className='bg-slate-700/50 rounded-lg p-3'>
					<div className='text-xs text-slate-400 mb-1'>
						ADJUSTED AVG. FLOAT
					</div>
					<div className='text-lg font-semibold text-white'>
						{hasInputs ? adjustedAverageFloat.toFixed(4) : "0.00"}
					</div>
				</div>

				<div className='bg-slate-700/50 rounded-lg p-3'>
					<div className='text-xs text-slate-400 mb-1'>
						TRADE UP COST
					</div>
					<div className='text-lg font-semibold text-green-400'>
						${hasInputs ? tradeUpCost.toFixed(2) : "0.00"}
					</div>
				</div>

				<div className='bg-slate-700/50 rounded-lg p-3'>
					<div className='text-xs text-slate-400 mb-1'>
						PROFITABILITY
					</div>
					<div className='text-lg font-semibold text-white'>
						{profitability !== null
							? `${profitability.toFixed(2)}%`
							: "—"}
					</div>
				</div>

				<div className='bg-slate-700/50 rounded-lg p-3'>
					<div className='text-xs text-slate-400 mb-1'>
						PROFIT/TRADEUP
					</div>
					<div className='text-lg font-semibold text-white'>
						{profitPerTradeUp !== null
							? `$${profitPerTradeUp.toFixed(2)}`
							: "—"}
					</div>
				</div>

				<div className='bg-slate-700/50 rounded-lg p-3'>
					<div className='text-xs text-slate-400 mb-1'>
						ODDS TO PROFIT
					</div>
					<div className='text-lg font-semibold text-white'>
						{oddsToProfit !== null
							? `${oddsToProfit.toFixed(2)}%`
							: "—"}
					</div>
				</div>
			</div>

			{/* Outcome Skins */}
			<div className='space-y-3'>
				{outcomes.length === 0 ? (
					<div className='text-center py-12 text-slate-400'>
						<svg
							className='w-16 h-16 mx-auto mb-4 opacity-50'
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
						<p className='text-sm'>
							{inputs.length < 10
								? "Add input skins to see possible outcomes"
								: "Calculating outcomes..."}
						</p>
					</div>
				) : (
					outcomes.map((outcome) => (
						<OutcomeSkinCard key={outcome.id} skin={outcome} />
					))
				)}
			</div>
		</div>
	);
}
