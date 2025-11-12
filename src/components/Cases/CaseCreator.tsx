import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface SelectedItem {
	item_id: number;
	drop_chance: number;
}

interface ItemWithPrice {
	id: number;
	name: string;
	rarity?: string;
	price?: {
		price: number;
	};
}

interface Collection {
	id: number;
	name: string;
}

interface CalculatedProbabilities {
	probabilities: SelectedItem[];
	expectedValue: number;
	houseEdge: number;
	isReasonable: boolean;
}

export default function CaseCreator({ userId }: { userId: string }) {
	const [step, setStep] = useState<
		"setup" | "items" | "probabilities" | "review"
	>("setup");

	// Step 1: Setup
	const [collections, setCollections] = useState<Collection[]>([]);
	const [isLoadingCollections, setIsLoadingCollections] = useState(false);
	const [isLoadingItems, setIsLoadingItems] = useState(false);
	const [selectedCollection, setSelectedCollection] = useState<number | null>(
		null
	);
	const [caseTitle, setCaseTitle] = useState("");
	const [caseDescription, setCaseDescription] = useState("");
	const [caseImageUrl, setCaseImageUrl] = useState("");
	const [casePrice, setCasePrice] = useState(100);

	// Step 2: Items
	const [availableItems, setAvailableItems] = useState<ItemWithPrice[]>([]);
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	// Step 3: Probabilities
	const [calculatedProbs, setCalculatedProbs] =
		useState<CalculatedProbabilities | null>(null);
	const [customProbs, setCustomProbs] = useState<SelectedItem[]>([]);
	const [isCalculating, setIsCalculating] = useState(false);

	// Step 4: Review & Create
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Load collections on mount
	useEffect(() => {
		fetchCollections();
	}, []);

	// Load items when collection is selected
	useEffect(() => {
		if (selectedCollection) {
			fetchCollectionItems(selectedCollection);
		}
	}, [selectedCollection]);

	const fetchCollections = async () => {
		setIsLoadingCollections(true);
		try {
			const response = await fetch(`${API_URL}/collections?limit=100`);
			const result = await response.json();
			console.log("Collections response:", result);
			setCollections(result.data?.collections || []);
		} catch (error) {
			console.error("Failed to fetch collections:", error);
			setError("Failed to load collections");
		} finally {
			setIsLoadingCollections(false);
		}
	};

	const fetchCollectionItems = async (collectionId: number) => {
		setIsLoadingItems(true);
		try {
			const response = await fetch(
				`${API_URL}/collections/${collectionId}/items`
			);
			const data = await response.json();
			console.log("Collection items response:", data);
			setAvailableItems(data.items || []);
		} catch (error) {
			console.error("Failed to fetch items:", error);
			setError("Failed to load collection items");
		} finally {
			setIsLoadingItems(false);
		}
	};

	const calculateProbabilities = async () => {
		if (selectedItems.length < 2) {
			setError("Select at least 2 items");
			return;
		}

		setIsCalculating(true);
		setError(null);

		try {
			const response = await fetch(
				`${API_URL}/cases/calculate-probabilities`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						items: selectedItems,
						casePrice,
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to calculate probabilities");
			}

			const data = await response.json();
			setCalculatedProbs(data);
			setCustomProbs(data.probabilities);
			setStep("probabilities");
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Calculation failed"
			);
		} finally {
			setIsCalculating(false);
		}
	};

	const updateCustomProbability = (itemId: number, newChance: number) => {
		setCustomProbs((prev) =>
			prev.map((item) =>
				item.item_id === itemId
					? { ...item, drop_chance: newChance }
					: item
			)
		);
	};

	const recalculateSummary = () => {
		if (customProbs.length === 0) return null;

		const total = customProbs.reduce(
			(sum, item) => sum + item.drop_chance,
			0
		);

		const expectedValue = customProbs.reduce((sum, item) => {
			const itemData = availableItems.find((i) => i.id === item.item_id);
			const price = itemData?.price?.price || 0;
			return sum + price * 100 * (item.drop_chance / 100);
		}, 0);

		const houseEdge = ((casePrice - expectedValue) / casePrice) * 100;

		return {
			total,
			expectedValue: Math.round(expectedValue),
			houseEdge: parseFloat(houseEdge.toFixed(2)),
			isValid: Math.abs(total - 100) < 0.01,
		};
	};

	const createCase = async () => {
		const summary = recalculateSummary();
		if (!summary?.isValid) {
			setError("Probabilities must sum to 100%");
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			const response = await fetch(`${API_URL}/cases`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					creatorId: userId,
					collectionId: selectedCollection,
					title: caseTitle,
					description: caseDescription,
					imageUrl: caseImageUrl,
					priceCredits: casePrice,
					items: customProbs,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create case");
			}

			setSuccess(true);
			setTimeout(() => {
				resetForm();
			}, 2000);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Creation failed"
			);
		} finally {
			setIsCreating(false);
		}
	};

	const resetForm = () => {
		setStep("setup");
		setSelectedCollection(null);
		setCaseTitle("");
		setCaseDescription("");
		setCaseImageUrl("");
		setCasePrice(100);
		setSelectedItems([]);
		setCalculatedProbs(null);
		setCustomProbs([]);
		setError(null);
		setSuccess(false);
	};

	const filteredItems = availableItems.filter((item) =>
		item.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const summary = recalculateSummary();

	return (
		<div className='max-w-6xl mx-auto'>
			{/* Header */}
			<div className='bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6'>
				<h1 className='text-3xl font-bold text-white mb-2'>
					Create Custom Case
				</h1>
				<p className='text-slate-400'>
					Design your own case with custom probabilities
				</p>
			</div>

			{/* Progress Steps */}
			<div className='bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6'>
				<div className='flex justify-between items-center'>
					{["setup", "items", "probabilities", "review"].map(
						(s, idx) => (
							<div key={s} className='flex items-center flex-1'>
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
										step === s
											? "bg-blue-500 text-white"
											: idx <
											  [
													"setup",
													"items",
													"probabilities",
													"review",
											  ].indexOf(step)
											? "bg-green-500 text-white"
											: "bg-slate-700 text-slate-400"
									}`}
								>
									{idx + 1}
								</div>
								<div className='ml-3 flex-1'>
									<div className='text-white font-medium capitalize'>
										{s}
									</div>
								</div>
								{idx < 3 && (
									<div
										className={`flex-1 h-1 mx-4 ${
											idx <
											[
												"setup",
												"items",
												"probabilities",
												"review",
											].indexOf(step)
												? "bg-green-500"
												: "bg-slate-700"
										}`}
									/>
								)}
							</div>
						)
					)}
				</div>
			</div>

			{/* Error/Success Messages */}
			{error && (
				<div className='bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6'>
					<p className='text-red-200'>❌ {error}</p>
				</div>
			)}

			{success && (
				<div className='bg-green-900/50 border border-green-500 rounded-lg p-4 mb-6'>
					<p className='text-green-200'>
						✅ Case created successfully!
					</p>
				</div>
			)}

			{/* Step 1: Setup */}
			{step === "setup" && (
				<div className='bg-slate-800 rounded-lg border border-slate-700 p-6'>
					<h2 className='text-2xl font-bold text-white mb-6'>
						Case Setup
					</h2>

					<div className='space-y-4'>
						<div>
							<label className='block text-slate-300 mb-2'>
								Collection
							</label>
							{isLoadingCollections ? (
								<div className='w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700 flex items-center justify-center'>
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2'></div>
									<span className='text-slate-400'>
										Loading collections...
									</span>
								</div>
							) : (
								<select
									value={selectedCollection || ""}
									onChange={(e) =>
										setSelectedCollection(
											Number(e.target.value)
										)
									}
									disabled={isLoadingCollections}
									className='w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700 disabled:opacity-50'
								>
									<option value=''>
										Select a collection
									</option>
									{collections.map((col) => (
										<option key={col.id} value={col.id}>
											{col.name}
										</option>
									))}
								</select>
							)}
							{collections.length === 0 &&
								!isLoadingCollections && (
									<p className='text-slate-500 text-sm mt-1'>
										No collections available
									</p>
								)}
						</div>

						<div>
							<label className='block text-slate-300 mb-2'>
								Case Title
							</label>
							<input
								type='text'
								value={caseTitle}
								onChange={(e) => setCaseTitle(e.target.value)}
								placeholder='Enter case title'
								className='w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700'
							/>
						</div>

						<div>
							<label className='block text-slate-300 mb-2'>
								Description
							</label>
							<textarea
								value={caseDescription}
								onChange={(e) =>
									setCaseDescription(e.target.value)
								}
								placeholder='Enter case description'
								rows={3}
								className='w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700'
							/>
						</div>

						<div>
							<label className='block text-slate-300 mb-2'>
								Image URL
							</label>
							<input
								type='text'
								value={caseImageUrl}
								onChange={(e) =>
									setCaseImageUrl(e.target.value)
								}
								placeholder='https://example.com/case-image.png'
								className='w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700'
							/>
						</div>

						<div>
							<label className='block text-slate-300 mb-2'>
								Case Price (Credits)
							</label>
							<input
								type='number'
								value={casePrice}
								onChange={(e) =>
									setCasePrice(Number(e.target.value))
								}
								min='50'
								max='10000'
								className='w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700'
							/>
							<p className='text-slate-500 text-sm mt-1'>
								${(casePrice / 100).toFixed(2)} USD
							</p>
						</div>
					</div>

					<button
						onClick={() => setStep("items")}
						disabled={!selectedCollection || !caseTitle}
						className='mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors'
					>
						Next: Select Items
					</button>
				</div>
			)}

			{/* Step 2: Select Items */}
			{step === "items" && (
				<div className='bg-slate-800 rounded-lg border border-slate-700 p-6'>
					<h2 className='text-2xl font-bold text-white mb-6'>
						Select Items ({selectedItems.length} selected)
					</h2>

					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Search items...'
						className='w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700 mb-4'
					/>

					{isLoadingItems ? (
						<div className='flex items-center justify-center py-20'>
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
							<span className='ml-3 text-slate-400'>
								Loading items...
							</span>
						</div>
					) : filteredItems.length === 0 ? (
						<div className='text-center py-20 text-slate-400'>
							{searchQuery
								? "No items found matching your search"
								: "No items available in this collection"}
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto'>
							{filteredItems.map((item) => {
								const isSelected = selectedItems.includes(
									item.id
								);
								return (
									<div
										key={item.id}
										onClick={() => {
											if (isSelected) {
												setSelectedItems(
													selectedItems.filter(
														(id) => id !== item.id
													)
												);
											} else {
												setSelectedItems([
													...selectedItems,
													item.id,
												]);
											}
										}}
										className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
											isSelected
												? "border-blue-500 bg-blue-900/30"
												: "border-slate-700 bg-slate-900 hover:border-slate-600"
										}`}
									>
										<div className='font-medium text-white mb-1'>
											{item.name}
										</div>
										<div className='text-sm text-slate-400'>
											$
											{item.price?.price?.toFixed(2) ||
												"N/A"}
										</div>
									</div>
								);
							})}
						</div>
					)}

					<div className='flex gap-4'>
						<button
							onClick={() => setStep("setup")}
							className='flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors'
						>
							Back
						</button>
						<button
							onClick={calculateProbabilities}
							disabled={selectedItems.length < 2 || isCalculating}
							className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors'
						>
							{isCalculating
								? "Calculating..."
								: "Calculate Probabilities"}
						</button>
					</div>
				</div>
			)}

			{/* Step 3: Probabilities */}
			{step === "probabilities" && calculatedProbs && (
				<div className='space-y-6'>
					<div className='bg-slate-800 rounded-lg border border-slate-700 p-6'>
						<h2 className='text-2xl font-bold text-white mb-4'>
							Probability Distribution
						</h2>

						{/* Summary Stats */}
						<div className='grid grid-cols-3 gap-4 mb-6'>
							<div className='bg-slate-900 p-4 rounded-lg'>
								<div className='text-slate-400 text-sm'>
									Expected Value
								</div>
								<div className='text-2xl font-bold text-white'>
									{summary?.expectedValue} credits
								</div>
								<div className='text-slate-500 text-sm'>
									$
									{(
										(summary?.expectedValue || 0) / 100
									).toFixed(2)}
								</div>
							</div>
							<div className='bg-slate-900 p-4 rounded-lg'>
								<div className='text-slate-400 text-sm'>
									House Edge
								</div>
								<div
									className={`text-2xl font-bold ${
										(summary?.houseEdge || 0) > 40
											? "text-red-400"
											: (summary?.houseEdge || 0) > 20
											? "text-yellow-400"
											: "text-green-400"
									}`}
								>
									{summary?.houseEdge.toFixed(2)}%
								</div>
							</div>
							<div className='bg-slate-900 p-4 rounded-lg'>
								<div className='text-slate-400 text-sm'>
									Total Probability
								</div>
								<div
									className={`text-2xl font-bold ${
										summary?.isValid
											? "text-green-400"
											: "text-red-400"
									}`}
								>
									{summary?.total.toFixed(2)}%
								</div>
							</div>
						</div>

						{/* Probability Table */}
						<div className='space-y-2 max-h-96 overflow-y-auto'>
							{customProbs.map((prob) => {
								const item = availableItems.find(
									(i) => i.id === prob.item_id
								);
								return (
									<div
										key={prob.item_id}
										className='bg-slate-900 p-4 rounded-lg flex items-center gap-4'
									>
										<div className='flex-1'>
											<div className='text-white font-medium'>
												{item?.name}
											</div>
											<div className='text-slate-400 text-sm'>
												$
												{item?.price?.price?.toFixed(
													2
												) || "N/A"}
											</div>
										</div>
										<div className='flex items-center gap-2'>
											<input
												type='number'
												value={prob.drop_chance}
												onChange={(e) =>
													updateCustomProbability(
														prob.item_id,
														parseFloat(
															e.target.value
														) || 0
													)
												}
												step='0.01'
												className='w-24 bg-slate-800 text-white rounded p-2 border border-slate-700'
											/>
											<span className='text-white'>
												%
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className='flex gap-4'>
						<button
							onClick={() => setStep("items")}
							className='flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors'
						>
							Back
						</button>
						<button
							onClick={() => setStep("review")}
							disabled={!summary?.isValid}
							className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors'
						>
							Review & Create
						</button>
					</div>
				</div>
			)}

			{/* Step 4: Review */}
			{step === "review" && (
				<div className='space-y-6'>
					<div className='bg-slate-800 rounded-lg border border-slate-700 p-6'>
						<h2 className='text-2xl font-bold text-white mb-6'>
							Review Case
						</h2>

						<div className='grid grid-cols-2 gap-6 mb-6'>
							<div>
								<h3 className='text-slate-400 mb-2'>
									Case Details
								</h3>
								<div className='bg-slate-900 p-4 rounded-lg space-y-2'>
									<div>
										<span className='text-slate-400'>
											Title:
										</span>{" "}
										<span className='text-white'>
											{caseTitle}
										</span>
									</div>
									<div>
										<span className='text-slate-400'>
											Price:
										</span>{" "}
										<span className='text-white'>
											{casePrice} credits ($
											{(casePrice / 100).toFixed(2)})
										</span>
									</div>
									<div>
										<span className='text-slate-400'>
											Items:
										</span>{" "}
										<span className='text-white'>
											{customProbs.length}
										</span>
									</div>
								</div>
							</div>

							<div>
								<h3 className='text-slate-400 mb-2'>
									Economics
								</h3>
								<div className='bg-slate-900 p-4 rounded-lg space-y-2'>
									<div>
										<span className='text-slate-400'>
											Expected Value:
										</span>{" "}
										<span className='text-white'>
											{summary?.expectedValue} credits
										</span>
									</div>
									<div>
										<span className='text-slate-400'>
											House Edge:
										</span>{" "}
										<span
											className={
												(summary?.houseEdge || 0) > 40
													? "text-red-400"
													: (summary?.houseEdge ||
															0) > 20
													? "text-yellow-400"
													: "text-green-400"
											}
										>
											{summary?.houseEdge.toFixed(2)}%
										</span>
									</div>
									<div>
										<span className='text-slate-400'>
											Fair?
										</span>{" "}
										<span
											className={
												calculatedProbs?.isReasonable
													? "text-green-400"
													: "text-yellow-400"
											}
										>
											{calculatedProbs?.isReasonable
												? "Yes"
												: "Edge too high"}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className='flex gap-4'>
						<button
							onClick={() => setStep("probabilities")}
							className='flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors'
						>
							Back
						</button>
						<button
							onClick={createCase}
							disabled={isCreating}
							className='flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors'
						>
							{isCreating ? "Creating..." : "Create Case"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
