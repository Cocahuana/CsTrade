import { useState } from "react";
import { useGetItemsQuery } from "../../store/api/itemsApi";
import ItemCard from "./ItemCard";

export default function ItemsPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [hasPrice, setHasPrice] = useState(true);

	const { data, isLoading, error } = useGetItemsQuery({
		page,
		limit: 24,
		search: search || undefined,
		hasPrice,
	});

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(searchInput);
		setPage(1);
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<h1 className='text-3xl font-bold text-white mb-2'>
					CS2 Items
				</h1>
				<p className='text-slate-300'>
					Browse all Counter-Strike 2 items with price ranges for all
					exteriors and StatTrak™ variants
				</p>
			</div>

			{/* Filters */}
			<div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
				<div className='flex flex-col md:flex-row gap-4'>
					{/* Search */}
					<form onSubmit={handleSearch} className='flex-1'>
						<div className='flex gap-2'>
							<input
								type='text'
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder='Search items...'
								className='flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500'
							/>
							<button
								type='submit'
								className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors'
							>
								Search
							</button>
						</div>
					</form>

					{/* Filter Toggle */}
					<label className='flex items-center gap-2 cursor-pointer whitespace-nowrap'>
						<input
							type='checkbox'
							checked={hasPrice}
							onChange={(e) => {
								setHasPrice(e.target.checked);
								setPage(1);
							}}
							className='w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800'
						/>
						<span className='text-sm text-slate-300'>
							Only show items with prices
						</span>
					</label>
				</div>

				{/* Active Filters */}
				{(search || hasPrice) && (
					<div className='mt-4 flex flex-wrap gap-2'>
						{search && (
							<span className='inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 rounded px-3 py-1 text-sm text-blue-300'>
								Search: "{search}"
								<button
									onClick={() => {
										setSearch("");
										setSearchInput("");
									}}
									className='hover:text-blue-100'
								>
									✕
								</button>
							</span>
						)}
						{hasPrice && (
							<span className='inline-flex items-center gap-2 bg-green-900/30 border border-green-700/50 rounded px-3 py-1 text-sm text-green-300'>
								Has prices
							</span>
						)}
					</div>
				)}
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className='text-center py-12'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
					<p className='mt-4 text-slate-400'>Loading items...</p>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className='bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center'>
					<p className='text-red-400'>Failed to load items</p>
					<p className='text-slate-400 text-sm mt-2'>
						{error && "data" in error
							? JSON.stringify(error.data)
							: "Unknown error"}
					</p>
				</div>
			)}

			{/* Items Grid */}
			{data && data.items.length > 0 && (
				<>
					{/* Results Info */}
					<div className='text-sm text-slate-400'>
						Showing {data.items.length} of {data.pagination.total}{" "}
						items
						{search && ` matching "${search}"`}
					</div>

					{/* Grid */}
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
						{data.items.map((item) => (
							<ItemCard key={item.id} item={item} />
						))}
					</div>

					{/* Pagination */}
					{data.pagination.totalPages > 1 && (
						<div className='flex items-center justify-center gap-2 mt-8'>
							<button
								onClick={() =>
									setPage((p) => Math.max(1, p - 1))
								}
								disabled={page === 1}
								className='bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-white px-4 py-2 rounded border border-slate-700 transition-colors'
							>
								Previous
							</button>

							<div className='flex items-center gap-2'>
								{Array.from(
									{
										length: Math.min(
											5,
											data.pagination.totalPages
										),
									},
									(_, i) => {
										const pageNum =
											data.pagination.totalPages <= 5
												? i + 1
												: Math.min(
														Math.max(page - 2, 1),
														data.pagination
															.totalPages - 4
												  ) + i;

										return (
											<button
												key={pageNum}
												onClick={() => setPage(pageNum)}
												className={`w-10 h-10 rounded border transition-colors ${
													page === pageNum
														? "bg-blue-600 border-blue-500 text-white"
														: "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
												}`}
											>
												{pageNum}
											</button>
										);
									}
								)}
							</div>

							<button
								onClick={() =>
									setPage((p) =>
										Math.min(
											data.pagination.totalPages,
											p + 1
										)
									)
								}
								disabled={page === data.pagination.totalPages}
								className='bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-white px-4 py-2 rounded border border-slate-700 transition-colors'
							>
								Next
							</button>
						</div>
					)}
				</>
			)}

			{/* No Results */}
			{data && data.items.length === 0 && (
				<div className='text-center py-12'>
					<div className='text-6xl mb-4'>🔍</div>
					<p className='text-slate-400'>
						{search
							? `No items found matching "${search}"`
							: "No items found"}
					</p>
				</div>
			)}
		</div>
	);
}
