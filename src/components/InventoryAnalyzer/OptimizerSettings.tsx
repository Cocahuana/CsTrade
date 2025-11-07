import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { updateSettings } from "../../store/slices/optimizerSlice";

export default function OptimizerSettings() {
	const dispatch = useDispatch();
	const { settings } = useSelector((state: RootState) => state.optimizer);

	return (
		<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
			<h3 className='text-lg font-bold text-white mb-4'>
				Optimizer Settings
			</h3>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{/* Min Profitability */}
				<div>
					<label className='block text-sm text-slate-300 mb-2'>
						Minimum Profitability (%)
					</label>
					<input
						type='number'
						value={settings.minProfitability}
						onChange={(e) =>
							dispatch(
								updateSettings({
									minProfitability: Number(e.target.value),
								})
							)
						}
						className='w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500'
						min='0'
						step='5'
					/>
				</div>

				{/* Max Cost */}
				<div>
					<label className='block text-sm text-slate-300 mb-2'>
						Maximum Cost ($)
					</label>
					<input
						type='number'
						value={settings.maxCost}
						onChange={(e) =>
							dispatch(
								updateSettings({
									maxCost: Number(e.target.value),
								})
							)
						}
						className='w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500'
						min='0'
						step='100'
					/>
				</div>

				{/* Min Odds to Profit */}
				<div>
					<label className='block text-sm text-slate-300 mb-2'>
						Min Odds to Profit (%)
					</label>
					<input
						type='number'
						value={settings.minOddsToProfit}
						onChange={(e) =>
							dispatch(
								updateSettings({
									minOddsToProfit: Number(e.target.value),
								})
							)
						}
						className='w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500'
						min='0'
						max='100'
						step='5'
					/>
				</div>

				{/* Max Risk */}
				<div>
					<label className='block text-sm text-slate-300 mb-2'>
						Maximum Risk Level
					</label>
					<select
						value={settings.maxRisk}
						onChange={(e) =>
							dispatch(
								updateSettings({
									maxRisk: e.target.value as
										| "low"
										| "medium"
										| "high",
								})
							)
						}
						className='w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500'
					>
						<option value='low'>Low</option>
						<option value='medium'>Medium</option>
						<option value='high'>High</option>
					</select>
				</div>

				{/* Allow StatTrak */}
				<div className='flex items-center'>
					<label className='flex items-center gap-3 cursor-pointer'>
						<input
							type='checkbox'
							checked={settings.allowStatTrak}
							onChange={(e) =>
								dispatch(
									updateSettings({
										allowStatTrak: e.target.checked,
									})
								)
							}
							className='w-5 h-5 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm text-slate-300'>
							Allow StatTrak™ items
						</span>
					</label>
				</div>
			</div>
		</div>
	);
}
