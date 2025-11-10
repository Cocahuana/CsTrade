import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { fetchCases, setFilters, setPage } from "../../store/slices/casesSlice";
import CaseCard from "./CaseCard";

interface CasesBrowserProps {
	onCaseClick?: (caseId: string) => void;
}

export default function CasesBrowser({ onCaseClick }: CasesBrowserProps) {
	const dispatch = useDispatch<AppDispatch>();
	const { cases, loading, error, filters, pagination } = useSelector(
		(state: RootState) => state.cases
	);

	useEffect(() => {
		dispatch(
			fetchCases({
				page: pagination.page,
				limit: pagination.limit,
				sortBy: filters.sortBy,
				featured: filters.featured,
				collectionId: filters.collectionId || undefined,
			})
		);
	}, [dispatch, pagination.page, filters]);

	const handleCaseClick = (caseId: string) => {
		if (onCaseClick) {
			onCaseClick(caseId);
		}
	};

	const handleSortChange = (sortBy: typeof filters.sortBy) => {
		dispatch(setFilters({ sortBy }));
	};

	const handlePageChange = (page: number) => {
		dispatch(setPage(page));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (error) {
		return (
			<div className='bg-red-900/20 border border-red-900 rounded-lg p-6 text-center'>
				<p className='text-red-400'>{error}</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-white mb-2'>
						Browse Cases
					</h1>
					<p className='text-slate-400'>
						Discover community-created cases with transparent drop
						rates
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className='bg-slate-800 rounded-lg p-4 border border-slate-700'>
				<div className='flex flex-wrap items-center gap-4'>
					<div className='flex items-center gap-2'>
						<label className='text-sm text-slate-400'>
							Sort by:
						</label>
						<select
							value={filters.sortBy}
							onChange={(e) =>
								handleSortChange(
									e.target.value as typeof filters.sortBy
								)
							}
							className='bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500'
						>
							<option value='popular'>Most Popular</option>
							<option value='newest'>Newest</option>
							<option value='price-low'>
								Price: Low to High
							</option>
							<option value='price-high'>
								Price: High to Low
							</option>
						</select>
					</div>

					<div className='flex items-center gap-2'>
						<input
							type='checkbox'
							id='featured'
							checked={filters.featured}
							onChange={(e) =>
								dispatch(
									setFilters({ featured: e.target.checked })
								)
							}
							className='w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500'
						/>
						<label
							htmlFor='featured'
							className='text-sm text-slate-400'
						>
							Featured only
						</label>
					</div>

					<div className='ml-auto text-sm text-slate-400'>
						{pagination.total} cases found
					</div>
				</div>
			</div>

			{/* Loading */}
			{loading && (
				<div className='flex justify-center items-center py-12'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
				</div>
			)}

			{/* Cases Grid */}
			{!loading && (
				<>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
						{cases.map((caseData) => (
							<CaseCard
								key={caseData.id}
								case={caseData}
								onClick={() => handleCaseClick(caseData.id)}
							/>
						))}
					</div>

					{cases.length === 0 && !loading && (
						<div className='bg-slate-800 rounded-lg p-12 border border-slate-700 text-center'>
							<div className='text-6xl mb-4'>📦</div>
							<h3 className='text-xl font-semibold text-white mb-2'>
								No Cases Found
							</h3>
							<p className='text-slate-400 mb-6'>
								Try adjusting your filters or be the first to
								create a case!
							</p>
						</div>
					)}
				</>
			)}

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<div className='flex justify-center items-center gap-2'>
					<button
						onClick={() => handlePageChange(pagination.page - 1)}
						disabled={pagination.page === 1}
						className='px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors'
					>
						Previous
					</button>

					<div className='flex gap-2'>
						{Array.from(
							{ length: pagination.totalPages },
							(_, i) => i + 1
						)
							.filter(
								(page) =>
									page === 1 ||
									page === pagination.totalPages ||
									Math.abs(page - pagination.page) <= 2
							)
							.map((page, index, array) => (
								<>
									{index > 0 &&
										array[index - 1] !== page - 1 && (
											<span
												key={`ellipsis-${page}`}
												className='px-2 text-slate-500'
											>
												...
											</span>
										)}
									<button
										key={page}
										onClick={() => handlePageChange(page)}
										className={`px-4 py-2 rounded transition-colors ${
											pagination.page === page
												? "bg-blue-500 text-white"
												: "bg-slate-700 text-white hover:bg-slate-600"
										}`}
									>
										{page}
									</button>
								</>
							))}
					</div>

					<button
						onClick={() => handlePageChange(pagination.page + 1)}
						disabled={pagination.page === pagination.totalPages}
						className='px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors'
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}
