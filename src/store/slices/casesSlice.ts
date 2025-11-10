import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Types
export interface CaseItem {
	id: string;
	dropChancePercentage: string; // API returns as string
	item: {
		id: number;
		name: string;
		priceCredits: number;
		price?: {
			price: number;
			lowestPrice: number;
			medianPrice: number;
		};
	};
}

export interface Case {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	priceCredits: number;
	timesOpened: number;
	totalRevenueCredits: number;
	isActive: boolean;
	isFeatured: boolean;
	expectedValue?: number;
	houseEdge?: number;
	itemCount?: number;
	creator: {
		id: string;
		username: string;
		steamName: string;
		avatarUrl: string;
	};
	collection?: {
		id: string;
		name: string;
	};
	caseItems?: CaseItem[];
}

export interface Opening {
	id: string;
	creditsSpent: number;
	itemValueCredits: number;
	openedAt: string;
	user?: {
		username: string;
		steamName: string;
		avatarUrl: string;
	};
	itemWon: {
		id: number;
		name: string;
		priceCredits: number;
		price?: {
			price: number;
		};
	};
	case?: {
		id: string;
		title: string;
		imageUrl: string;
	};
}

interface CasesState {
	cases: Case[];
	selectedCase: Case | null;
	recentOpenings: Opening[];
	userOpenings: Opening[];
	loading: boolean;
	error: string | null;
	filters: {
		sortBy: "popular" | "newest" | "price-low" | "price-high";
		featured: boolean;
		collectionId: string | null;
	};
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

const initialState: CasesState = {
	cases: [],
	selectedCase: null,
	recentOpenings: [],
	userOpenings: [],
	loading: false,
	error: null,
	filters: {
		sortBy: "popular",
		featured: false,
		collectionId: null,
	},
	pagination: {
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	},
};

// Async Thunks
export const fetchCases = createAsyncThunk(
	"cases/fetchCases",
	async (
		params: {
			page?: number;
			limit?: number;
			sortBy?: string;
			featured?: boolean;
			collectionId?: string;
		} = {}
	) => {
		const queryParams = new URLSearchParams();
		if (params.page) queryParams.append("page", params.page.toString());
		if (params.limit) queryParams.append("limit", params.limit.toString());
		if (params.sortBy) queryParams.append("sortBy", params.sortBy);
		if (params.featured) queryParams.append("featured", "true");
		if (params.collectionId)
			queryParams.append("collectionId", params.collectionId);

		const response = await fetch(`${API_URL}/cases?${queryParams}`);
		if (!response.ok) throw new Error("Failed to fetch cases");
		return response.json();
	}
);

export const fetchCaseById = createAsyncThunk(
	"cases/fetchCaseById",
	async (caseId: string) => {
		const response = await fetch(`${API_URL}/cases/${caseId}`);
		if (!response.ok) throw new Error("Failed to fetch case");
		return response.json();
	}
);

export const fetchRecentOpenings = createAsyncThunk(
	"cases/fetchRecentOpenings",
	async (limit: number = 100) => {
		const response = await fetch(
			`${API_URL}/openings/recent/all?limit=${limit}`
		);
		if (!response.ok) throw new Error("Failed to fetch recent openings");
		const data = await response.json();
		return data.openings;
	}
);

export const fetchUserOpenings = createAsyncThunk(
	"cases/fetchUserOpenings",
	async (userId: string) => {
		const response = await fetch(`${API_URL}/openings/user/${userId}`);
		if (!response.ok) throw new Error("Failed to fetch user openings");
		const data = await response.json();
		return data.openings;
	}
);

export const openCase = createAsyncThunk(
	"cases/openCase",
	async ({ userId, caseId }: { userId: string; caseId: string }) => {
		const response = await fetch(`${API_URL}/openings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, caseId }),
		});
		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to open case");
		}
		return response.json();
	}
);

// Slice
const casesSlice = createSlice({
	name: "cases",
	initialState,
	reducers: {
		setFilters: (
			state,
			action: PayloadAction<Partial<CasesState["filters"]>>
		) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		setPage: (state, action: PayloadAction<number>) => {
			state.pagination.page = action.payload;
		},
		clearSelectedCase: (state) => {
			state.selectedCase = null;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// Fetch Cases
		builder
			.addCase(fetchCases.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCases.fulfilled, (state, action) => {
				state.loading = false;
				state.cases = action.payload.cases;
				state.pagination = action.payload.pagination;
			})
			.addCase(fetchCases.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch cases";
			});

		// Fetch Case by ID
		builder
			.addCase(fetchCaseById.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCaseById.fulfilled, (state, action) => {
				state.loading = false;
				state.selectedCase = action.payload;
			})
			.addCase(fetchCaseById.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch case";
			});

		// Fetch Recent Openings
		builder
			.addCase(fetchRecentOpenings.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchRecentOpenings.fulfilled, (state, action) => {
				state.loading = false;
				state.recentOpenings = action.payload;
			})
			.addCase(fetchRecentOpenings.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch openings";
			});

		// Fetch User Openings
		builder.addCase(fetchUserOpenings.fulfilled, (state, action) => {
			state.userOpenings = action.payload;
		});

		// Open Case
		builder
			.addCase(openCase.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(openCase.fulfilled, (state) => {
				state.loading = false;
			})
			.addCase(openCase.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to open case";
			});
	},
});

export const { setFilters, setPage, clearSelectedCase, clearError } =
	casesSlice.actions;
export default casesSlice.reducer;
