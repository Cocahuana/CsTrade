import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { OptimizerState, OptimizerSettings } from "../../types/optimizer";
import type { InventoryItem, PriceData } from "../../types/steam";
import { findOptimalTradeUps } from "../../utils/inventoryOptimizer";

const defaultSettings: OptimizerSettings = {
	minProfitability: 10, // 10% minimum profit
	maxRisk: "medium",
	maxCost: 1000, // $1000 max
	allowStatTrak: true,
	minOddsToProfit: 30, // 30% minimum chance to profit
};

const initialState: OptimizerState = {
	inventory: [],
	prices: {},
	suggestions: [],
	settings: defaultSettings,
	isAnalyzing: false,
	progress: 0,
	error: null,
	lastAnalyzed: null,
};

// Async thunk to analyze inventory and find optimal trade-ups
export const analyzeInventory = createAsyncThunk(
	"optimizer/analyzeInventory",
	async (
		{
			inventory,
			prices,
			settings,
		}: {
			inventory: InventoryItem[];
			prices: Record<string, PriceData>;
			settings?: Partial<OptimizerSettings>;
		},
		{ rejectWithValue }
	) => {
		try {
			// Merge with default settings
			const finalSettings: OptimizerSettings = {
				...defaultSettings,
				...settings,
			};

			// Run the optimizer
			const suggestions = findOptimalTradeUps(
				inventory,
				prices,
				finalSettings
			);

			return {
				suggestions,
				timestamp: Date.now(),
			};
		} catch (error) {
			return rejectWithValue(
				error instanceof Error ? error.message : "Analysis failed"
			);
		}
	}
);

export const optimizerSlice = createSlice({
	name: "optimizer",
	initialState,
	reducers: {
		setInventory: (state, action: PayloadAction<InventoryItem[]>) => {
			state.inventory = action.payload;
		},

		setPrices: (
			state,
			action: PayloadAction<Record<string, PriceData>>
		) => {
			state.prices = action.payload;
		},

		updateSettings: (
			state,
			action: PayloadAction<Partial<OptimizerSettings>>
		) => {
			state.settings = {
				...state.settings,
				...action.payload,
			};
		},

		clearSuggestions: (state) => {
			state.suggestions = [];
			state.lastAnalyzed = null;
		},

		removeSuggestion: (state, action: PayloadAction<string>) => {
			state.suggestions = state.suggestions.filter(
				(s) => s.id !== action.payload
			);
		},

		resetOptimizer: () => initialState,
	},

	extraReducers: (builder) => {
		builder
			.addCase(analyzeInventory.pending, (state) => {
				state.isAnalyzing = true;
				state.progress = 0;
				state.error = null;
			})
			.addCase(analyzeInventory.fulfilled, (state, action) => {
				state.isAnalyzing = false;
				state.progress = 100;
				state.suggestions = action.payload.suggestions;
				state.lastAnalyzed = action.payload.timestamp;
			})
			.addCase(analyzeInventory.rejected, (state, action) => {
				state.isAnalyzing = false;
				state.progress = 0;
				state.error = action.payload as string;
			});
	},
});

export const {
	setInventory,
	setPrices,
	updateSettings,
	clearSuggestions,
	removeSuggestion,
	resetOptimizer,
} = optimizerSlice.actions;

export default optimizerSlice.reducer;
