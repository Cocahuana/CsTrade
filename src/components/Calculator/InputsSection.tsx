import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
	addInputSkin,
	removeInputSkin,
} from "../../store/slices/calculatorSlice";
import InputSkinCard from "./InputSkinCard";
export default function InputsSection() {
	const dispatch = useDispatch();
	const { inputs } = useSelector((state: RootState) => state.calculator);

	const handleAddSkin = () => {
		// This will open a modal/dialog to search and add skins
		// For now, we'll just add a placeholder
		const newSkin = {
			id: `skin-${Date.now()}`,
			name: "New Skin",
			rarity: "Mil-Spec" as const,
			exterior: "Factory New" as const,
			float: 0.01,
			price: 0,
			statTrak: false,
		};
		dispatch(addInputSkin(newSkin));
	};

	const handleRemoveSkin = (index: number) => {
		dispatch(removeInputSkin(index));
	};

	const emptySlots = 10 - inputs.length;

	return (
		<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
			<h3 className='text-xl font-bold text-white mb-4'>INPUTS</h3>

			<div className='space-y-3'>
				{/* Existing Input Skins */}
				{inputs.map((skin, index) => (
					<InputSkinCard
						key={skin.id}
						skin={skin}
						index={index}
						onRemove={() => handleRemoveSkin(index)}
					/>
				))}

				{/* Empty Slots */}
				{Array.from({ length: emptySlots }).map((_, index) => (
					<button
						key={`empty-${index}`}
						onClick={handleAddSkin}
						className='w-full h-20 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 hover:bg-slate-700/50 transition-all flex items-center justify-center group'
					>
						<span className='text-4xl text-slate-600 group-hover:text-blue-500 transition-colors'>
							+
						</span>
					</button>
				))}
			</div>

			{inputs.length > 0 && (
				<div className='mt-4 text-sm text-slate-400'>
					{inputs.length}/10 skins selected
				</div>
			)}
		</div>
	);
}
