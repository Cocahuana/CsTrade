import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { InputSkin, OutcomeSkin } from "../../types/calculator";

interface CalculatorState {
	inputs: InputSkin[];
	outcomes: OutcomeSkin[];
	fixOutcomePrices: boolean;
	statTrakEnabled: boolean;
	priceSource: string;
	feesApplied: number;
	averageFloat: number;
	adjustedAverageFloat: number;
	tradeUpCost: number;
	profitability: number | null;
	profitPerTradeUp: number | null;
	oddsToProfit: number | null;
}

const initialState: CalculatorState = {
	inputs: [],
	outcomes: [],
	fixOutcomePrices: false,
	statTrakEnabled: false,
	priceSource: "steam",
	feesApplied: 0,
	averageFloat: 0,
	adjustedAverageFloat: 0,
	tradeUpCost: 0,
	profitability: null,
	profitPerTradeUp: null,
	oddsToProfit: null,
};

export const calculatorSlice = createSlice({
	name: "calculator",
	initialState,
	reducers: {
		addInputSkin: (state, action: PayloadAction<InputSkin>) => {
			if (state.inputs.length < 10) {
				state.inputs.push(action.payload);
			}
		},
		removeInputSkin: (state, action: PayloadAction<number>) => {
			state.inputs = state.inputs.filter(
				(_, index) => index !== action.payload
			);
		},
		updateInputSkin: (
			state,
			action: PayloadAction<{ index: number; skin: InputSkin }>
		) => {
			state.inputs[action.payload.index] = action.payload.skin;
		},
		toggleFixOutcomePrices: (state) => {
			state.fixOutcomePrices = !state.fixOutcomePrices;
		},
		toggleStatTrak: (state) => {
			state.statTrakEnabled = !state.statTrakEnabled;
		},
		setPriceSource: (state, action: PayloadAction<string>) => {
			state.priceSource = action.payload;
		},
		setFeesApplied: (state, action: PayloadAction<number>) => {
			state.feesApplied = action.payload;
		},
		calculateOutcomes: (state) => {
			// This will be implemented with the actual calculation logic
			// For now, just calculate basic stats
			if (state.inputs.length > 0) {
				state.tradeUpCost = state.inputs.reduce(
					(sum, input) => sum + input.price,
					0
				);
				state.averageFloat =
					state.inputs.reduce((sum, input) => sum + input.float, 0) /
					state.inputs.length;
			}
		},
		resetCalculator: () => initialState,
	},
});

export const {
	addInputSkin,
	removeInputSkin,
	updateInputSkin,
	toggleFixOutcomePrices,
	toggleStatTrak,
	setPriceSource,
	setFeesApplied,
	calculateOutcomes,
	resetCalculator,
} = calculatorSlice.actions;

export default calculatorSlice.reducer;
