import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Types for CS2 Items
export interface CS2Rarity {
	name: string;
	color: string;
	tier: number;
}

export interface CS2ItemsMetadata {
	totalCollections: number;
	totalWeaponTypes: number;
	supportedExteriors: number;
	lastUpdated: string;
}

export interface CS2ItemsData {
	collections: string[];
	rarities: Record<string, CS2Rarity>;
	exteriors: string[];
	weaponTypes: string[];
	metadata: CS2ItemsMetadata;
}

export interface CollectionItemsData {
	[collectionName: string]: {
		[rarity: string]: string[];
	};
}

export interface CS2ItemsState {
	data: CS2ItemsData | null;
	collectionItems: CollectionItemsData | null;
	isLoading: boolean;
	isLoadingCollectionItems: boolean;
	error: string | null;
	lastFetched: number | null;
}

const initialState: CS2ItemsState = {
	data: null,
	collectionItems: null,
	isLoading: false,
	isLoadingCollectionItems: false,
	error: null,
	lastFetched: null,
};

// Async thunk to fetch CS2 items from backend
export const fetchCS2Items = createAsyncThunk(
	"cs2Items/fetchItems",
	async (_, { rejectWithValue }) => {
		try {
			const response = await fetch(
				"http://localhost:5000/api/steam/items/all"
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Failed to fetch CS2 items");
			}

			return result.data;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error
					? error.message
					: "Failed to fetch CS2 items"
			);
		}
	}
);

// Async thunk to fetch collection items database
export const fetchCollectionItems = createAsyncThunk(
	"cs2Items/fetchCollectionItems",
	async (_, { rejectWithValue }) => {
		try {
			const response = await fetch(
				"http://localhost:5000/api/steam/items/collection-items"
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(
					result.error || "Failed to fetch collection items"
				);
			}

			return result.data;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error
					? error.message
					: "Failed to fetch collection items"
			);
		}
	}
);

export const cs2ItemsSlice = createSlice({
	name: "cs2Items",
	initialState,
	reducers: {
		clearCS2Items: (state) => {
			state.data = null;
			state.error = null;
			state.lastFetched = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch CS2 Items
			.addCase(fetchCS2Items.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(fetchCS2Items.fulfilled, (state, action) => {
				state.isLoading = false;
				state.data = action.payload;
				state.lastFetched = Date.now();
				state.error = null;
			})
			.addCase(fetchCS2Items.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			// Fetch Collection Items
			.addCase(fetchCollectionItems.pending, (state) => {
				state.isLoadingCollectionItems = true;
				state.error = null;
			})
			.addCase(fetchCollectionItems.fulfilled, (state, action) => {
				state.isLoadingCollectionItems = false;
				state.collectionItems = action.payload;
				state.error = null;
			})
			.addCase(fetchCollectionItems.rejected, (state, action) => {
				state.isLoadingCollectionItems = false;
				state.error = action.payload as string;
			});
	},
});

export const { clearCS2Items } = cs2ItemsSlice.actions;

export default cs2ItemsSlice.reducer;
