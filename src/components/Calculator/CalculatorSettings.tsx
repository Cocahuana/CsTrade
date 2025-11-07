import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
	toggleFixOutcomePrices,
	toggleStatTrak,
	setPriceSource,
	setFeesApplied,
} from "../../store/slices/calculatorSlice";

export default function CalculatorSettings() {
	const dispatch = useDispatch();
	const { fixOutcomePrices, statTrakEnabled, priceSource, feesApplied } =
		useSelector((state: RootState) => state.calculator);

	return (
		<div className='bg-slate-800 rounded-lg p-4 border border-slate-700'>
			<div className='flex flex-wrap gap-4 items-center'>
				{/* Fix Outcome Prices Toggle */}
				<label className='flex items-center gap-2 cursor-pointer'>
					<span className='text-sm text-slate-300'>
						Fix outcome prices
					</span>
					<button
						onClick={() => dispatch(toggleFixOutcomePrices())}
						className={`relative w-12 h-6 rounded-full transition-colors ${
							fixOutcomePrices ? "bg-blue-600" : "bg-slate-600"
						}`}
					>
						<span
							className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
								fixOutcomePrices ? "translate-x-6" : ""
							}`}
						/>
					</button>
				</label>

				{/* StatTrak Toggle */}
				<label className='flex items-center gap-2 cursor-pointer'>
					<span className='text-sm text-slate-300'>StatTrak™</span>
					<button
						onClick={() => dispatch(toggleStatTrak())}
						className={`relative w-12 h-6 rounded-full transition-colors ${
							statTrakEnabled ? "bg-blue-600" : "bg-slate-600"
						}`}
					>
						<span
							className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
								statTrakEnabled ? "translate-x-6" : ""
							}`}
						/>
					</button>
				</label>

				{/* Price Source */}
				<div className='flex items-center gap-2'>
					<span className='text-sm text-slate-300'>Price source</span>
					<select
						value={priceSource}
						onChange={(e) =>
							dispatch(setPriceSource(e.target.value))
						}
						className='bg-slate-700 text-white text-sm rounded px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500'
					>
						<option value='steam'>Steam</option>
						<option value='skinport'>Skinport</option>
						<option value='buff163'>Buff163</option>
					</select>
				</div>

				{/* Fees Applied */}
				<div className='flex items-center gap-2'>
					<span className='text-sm text-slate-300'>Fees applied</span>
					<input
						type='number'
						value={feesApplied}
						onChange={(e) =>
							dispatch(setFeesApplied(Number(e.target.value)))
						}
						className='bg-slate-700 text-white text-sm rounded px-3 py-1.5 w-20 border border-slate-600 focus:outline-none focus:border-blue-500'
						min='0'
						max='100'
					/>
					<span className='text-sm text-slate-400'>%</span>
				</div>
			</div>
		</div>
	);
}
