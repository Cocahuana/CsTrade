import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import {
	fetchCaseById,
	openCase,
	fetchRecentOpenings,
} from "../../store/slices/casesSlice";

interface CaseDetailsProps {
	caseId: string;
	userId: string;
	onBack: () => void;
}

export default function CaseDetails({
	caseId,
	userId,
	onBack,
}: CaseDetailsProps) {
	const dispatch = useDispatch<AppDispatch>();
	const { selectedCase, recentOpenings, loading } = useSelector(
		(state: RootState) => state.cases
	);
	const [isOpening, setIsOpening] = useState(false);
	const [wonItem, setWonItem] = useState<any>(null);

	useEffect(() => {
		dispatch(fetchCaseById(caseId));
		dispatch(fetchRecentOpenings(10));
	}, [dispatch, caseId]);

	const handleOpenCase = async () => {
		if (!selectedCase || isOpening) return;

		setIsOpening(true);
		try {
			const result = await dispatch(
				openCase({ userId, caseId })
			).unwrap();
			setWonItem(result.itemWon);

			// Refresh recent openings after opening
			setTimeout(() => {
				dispatch(fetchRecentOpenings(10));
			}, 1000);
		} catch (error) {
			console.error("Failed to open case:", error);
		} finally {
			setTimeout(() => {
				setIsOpening(false);
			}, 3000);
		}
	};

	if (loading || !selectedCase) {
		return (
			<div className='flex justify-center items-center py-12'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
			</div>
		);
	}

	const priceUSD = (selectedCase.priceCredits / 100).toFixed(2);
	const expectedValue = (selectedCase.caseItems || []).reduce(
		(sum, item) =>
			sum +
			(item.item.priceCredits / 100) *
				(parseFloat(item.dropChancePercentage) / 100),
		0
	);
	const houseEdge =
		((selectedCase.priceCredits / 100 - expectedValue) /
			(selectedCase.priceCredits / 100)) *
		100;

	return (
		<div className='space-y-6'>
			{/* Back Button */}
			<button
				onClick={onBack}
				className='flex items-center gap-2 text-slate-400 hover:text-white transition-colors'
			>
				<span>←</span>
				Back to Browse
			</button>

			{/* Case Header */}
			<div className='bg-slate-800 rounded-lg border border-slate-700 overflow-hidden'>
				<div className='grid md:grid-cols-2 gap-6 p-6'>
					{/* Image */}
					<div className='aspect-square rounded-lg bg-slate-900/50 flex items-center justify-center overflow-hidden'>
						{selectedCase.imageUrl ? (
							<img
								src={selectedCase.imageUrl}
								alt={selectedCase.title}
								className='w-full h-full object-cover'
							/>
						) : (
							<div className='text-8xl'>📦</div>
						)}
					</div>

					{/* Info */}
					<div className='flex flex-col justify-between'>
						<div>
							{selectedCase.isFeatured && (
								<div className='inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm font-semibold mb-3'>
									⭐ FEATURED
								</div>
							)}
							<h1 className='text-3xl font-bold text-white mb-2'>
								{selectedCase.title}
							</h1>
							<p className='text-slate-400 mb-6'>
								{selectedCase.description}
							</p>

							<div className='grid grid-cols-2 gap-4 mb-6'>
								<div className='bg-slate-900/50 rounded p-3'>
									<div className='text-slate-400 text-sm mb-1'>
										Price
									</div>
									<div className='text-white text-xl font-semibold'>
										${priceUSD}
									</div>
								</div>
								<div className='bg-slate-900/50 rounded p-3'>
									<div className='text-slate-400 text-sm mb-1'>
										Expected Value
									</div>
									<div className='text-green-400 text-xl font-semibold'>
										${expectedValue.toFixed(2)}
									</div>
								</div>
								<div className='bg-slate-900/50 rounded p-3'>
									<div className='text-slate-400 text-sm mb-1'>
										House Edge
									</div>
									<div
										className={`text-xl font-semibold ${
											houseEdge > 30
												? "text-red-400"
												: houseEdge > 20
												? "text-yellow-400"
												: "text-green-400"
										}`}
									>
										{houseEdge.toFixed(2)}%
									</div>
								</div>
								<div className='bg-slate-900/50 rounded p-3'>
									<div className='text-slate-400 text-sm mb-1'>
										Times Opened
									</div>
									<div className='text-white text-xl font-semibold'>
										{selectedCase.timesOpened.toLocaleString()}
									</div>
								</div>
							</div>

							<div className='flex items-center gap-3 mb-6'>
								<div className='w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold'>
									{(selectedCase.creator.username ||
										selectedCase.creator
											.steamName)[0].toUpperCase()}
								</div>
								<div>
									<div className='text-sm text-slate-400'>
										Created by
									</div>
									<div className='text-white font-medium'>
										{selectedCase.creator.username ||
											selectedCase.creator.steamName}
									</div>
								</div>
							</div>
						</div>

						<button
							onClick={handleOpenCase}
							disabled={isOpening}
							className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:cursor-not-allowed'
						>
							{isOpening
								? "Opening..."
								: `Open Case - $${priceUSD}`}
						</button>
					</div>
				</div>
			</div>

			{/* Opening Result */}
			{wonItem && (
				<div className='bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500 p-6 text-center animate-pulse'>
					<h3 className='text-2xl font-bold text-white mb-2'>
						🎉 You won!
					</h3>
					<div className='text-xl text-blue-300 mb-4'>
						{wonItem.name}
					</div>
					<div className='text-green-400 font-semibold'>
						${(wonItem.priceCredits / 100).toFixed(2)}
					</div>
				</div>
			)}

			{/* Drop Table */}
			<div className='bg-slate-800 rounded-lg border border-slate-700 p-6'>
				<h2 className='text-xl font-bold text-white mb-4'>
					Drop Table
				</h2>
				<div className='space-y-2'>
					{[...(selectedCase.caseItems || [])]
						.sort(
							(a, b) =>
								parseFloat(b.dropChancePercentage) -
								parseFloat(a.dropChancePercentage)
						)
						.map((caseItem) => (
							<div
								key={caseItem.id}
								className='flex items-center justify-between bg-slate-900/50 rounded p-3'
							>
								<div className='flex items-center gap-3'>
									<div className='text-2xl'>🔫</div>
									<div>
										<div className='text-white font-medium'>
											{caseItem.item.name}
										</div>
										<div className='text-sm text-slate-400'>
											$
											{(
												caseItem.item.priceCredits / 100
											).toFixed(2)}
										</div>
									</div>
								</div>
								<div className='text-right'>
									<div className='text-white font-semibold'>
										{parseFloat(
											caseItem.dropChancePercentage
										).toFixed(2)}
										%
									</div>
									<div className='text-xs text-slate-400'>
										1 in{" "}
										{Math.round(
											100 /
												parseFloat(
													caseItem.dropChancePercentage
												)
										)}
									</div>
								</div>
							</div>
						))}
				</div>
			</div>

			{/* Recent Openings */}
			<div className='bg-slate-800 rounded-lg border border-slate-700 p-6'>
				<h2 className='text-xl font-bold text-white mb-4'>
					Recent Openings
				</h2>
				<div className='space-y-2'>
					{recentOpenings
						.filter((opening) => opening.case?.id === caseId)
						.slice(0, 5)
						.map((opening) => (
							<div
								key={opening.id}
								className='flex items-center justify-between bg-slate-900/50 rounded p-3'
							>
								<div className='flex items-center gap-3'>
									<div className='w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-semibold'>
										{opening.user
											? (opening.user.username ||
													opening.user
														.steamName)[0].toUpperCase()
											: "?"}
									</div>
									<div className='text-white'>
										{opening.user
											? opening.user.username ||
											  opening.user.steamName
											: "Anonymous"}
									</div>
								</div>
								<div className='flex items-center gap-4'>
									<div className='text-slate-400'>
										{opening.itemWon.name}
									</div>
									<div
										className={`font-semibold ${
											opening.itemValueCredits >
											opening.creditsSpent
												? "text-green-400"
												: "text-red-400"
										}`}
									>
										$
										{(
											opening.itemValueCredits / 100
										).toFixed(2)}
									</div>
								</div>
							</div>
						))}
					{recentOpenings.filter(
						(opening) => opening.case?.id === caseId
					).length === 0 && (
						<div className='text-center text-slate-400 py-4'>
							No recent openings yet. Be the first!
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
