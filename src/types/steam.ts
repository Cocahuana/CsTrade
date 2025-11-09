// Steam API response types

export interface SteamInventoryResponse {
	assets: SteamAsset[];
	descriptions: SteamDescription[];
	total_inventory_count: number;
	success: number;
	rwgrsn: number;
}

export interface SteamAsset {
	appid: number;
	contextid: string;
	assetid: string;
	classid: string;
	instanceid: string;
	amount: string;
}

export interface SteamDescription {
	appid: number;
	classid: string;
	instanceid: string;
	currency: number;
	background_color: string;
	icon_url: string;
	icon_url_large?: string;
	descriptions: Array<{
		value: string;
		color?: string;
	}>;
	tradable: number;
	name: string;
	name_color?: string;
	type: string;
	market_name: string;
	market_hash_name: string;
	market_actions?: Array<{
		link: string;
		name: string;
	}>;
	commodity: number;
	market_tradable_restriction: number;
	marketable: number;
	tags: SteamTag[];
}

export interface SteamTag {
	category: string;
	internal_name: string;
	localized_category_name: string;
	localized_tag_name: string;
	color?: string;
}

export interface SteamPriceResponse {
	success: boolean;
	lowest_price?: string;
	volume?: string;
	median_price?: string;
}

// Processed inventory item
export interface InventoryItem {
	assetId: string;
	name: string;
	marketHashName: string;
	rarity: string;
	type: string;
	exterior?: string;
	statTrak: boolean;
	imageUrl: string;
	tradable: boolean;
	marketable: boolean;
	tradeableAfterDays?: number; // Days until item becomes tradeable (0 if immediately tradeable)
	collection?: string;
	float?: number;
	price?: number;
}

// Skinport API types
export interface SkinportItem {
	market_hash_name: string;
	currency: string;
	suggested_price: number;
	item_page: string;
	market_page: string;
	min_price: number;
	max_price: number;
	mean_price: number;
	median_price: number;
	quantity: number;
	created_at: number;
	updated_at: number;
}

export interface SkinportResponse {
	items: SkinportItem[];
}

// Our unified price data
export interface PriceData {
	marketHashName: string;
	price: number;
	lowestPrice?: number;
	medianPrice?: number;
	volume?: number;
	source: "steam" | "skinport" | "cached";
	timestamp: number;
}
