import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import OutcomesSection from "./OutcomesSection";
import CalculatorSettings from "./CalculatorSettings";
import InputsSection from "./InputsSection";
export default function Calculator() {
	const { inputs } = useSelector((state: RootState) => state.calculator);

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h2 className='text-3xl font-bold text-white mb-2'>
					CALCULATOR
				</h2>
				<p className='text-slate-300'>
					Most complete Counter Strike 2 calculator. Automatically get
					odds to discover CS2 profitable trade ups.
				</p>
			</div>

			{/* Settings */}
			<CalculatorSettings />

			{/* Main Content */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Inputs Section */}
				<InputsSection />

				{/* Outcomes Section */}
				<OutcomesSection />
			</div>

			{/* Info Banner */}
			{inputs.length < 10 && (
				<div className='bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center'>
					<p className='text-blue-300 text-sm'>
						SELECT {10 - inputs.length} MORE INPUT SKIN
						{inputs.length !== 9 ? "S" : ""} - OUTCOMES WILL BE
						CALCULATED AUTOMATICALLY
					</p>
				</div>
			)}
		</div>
	);
}
