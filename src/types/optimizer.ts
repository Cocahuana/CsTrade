// Trade-up optimizer types
import type { InventoryItem, PriceData } from "./steam";

export interface OptimalTradeUp {
	id: string;
	inputs: InventoryItem[];
	outcomes: PredictedOutcome[];
	stats: TradeUpStats;
	rank: number; // How good is this trade-up (1 = best)
}

export interface PredictedOutcome {
	name: string;
	marketHashName: string;
	rarity: string;
	exterior: string;
	collection: string;
	probability: number;
	estimatedPrice: number;
	minFloat: number;
	maxFloat: number;
	imageUrl?: string;
}

export interface TradeUpStats {
	totalCost: number;
	expectedValue: number;
	expectedProfit: number;
	profitability: number; // percentage
	oddsToProfit: number; // percentage of outcomes that profit
	risk: "low" | "medium" | "high";
	confidence: number; // 0-100, how confident we are in the prices
}

export interface OptimizerSettings {
	minProfitability: number; // minimum % profit to consider
	maxRisk: "low" | "medium" | "high";
	maxCost: number; // maximum total cost willing to spend
	preferCollections?: string[]; // prioritize certain collections
	allowStatTrak: boolean;
	minOddsToProfit: number; // minimum % chance to profit
}

export interface OptimizerResult {
	suggestions: OptimalTradeUp[];
	analyzedCombinations: number;
	inventoryValue: number;
	possibleTradeUps: number;
	timestamp: number;
}

// For the optimizer state
export interface OptimizerState {
	inventory: InventoryItem[];
	prices: Record<string, PriceData>;
	suggestions: OptimalTradeUp[];
	settings: OptimizerSettings;
	isAnalyzing: boolean;
	progress: number; // 0-100
	error: string | null;
	lastAnalyzed: number | null;
}
