export type Rarity =
	| "Consumer"
	| "Industrial"
	| "Mil-Spec"
	| "Restricted"
	| "Classified"
	| "Covert";

export type Exterior =
	| "Factory New"
	| "Minimal Wear"
	| "Field-Tested"
	| "Well-Worn"
	| "Battle-Scarred";

export interface InputSkin {
	id: string;
	name: string;
	rarity: Rarity;
	exterior: Exterior;
	float: number;
	price: number;
	statTrak: boolean;
	imageUrl?: string;
	collection?: string;
}

export interface OutcomeSkin {
	id: string;
	name: string;
	rarity: Rarity;
	exterior: Exterior;
	minFloat: number;
	maxFloat: number;
	price: number;
	probability: number;
	statTrak: boolean;
	imageUrl?: string;
	collection?: string;
}

export interface CalculatorStats {
	averageFloat: number;
	adjustedAverageFloat: number;
	tradeUpCost: number;
	profitability: number | null;
	profitPerTradeUp: number | null;
	oddsToProfit: number | null;
}
