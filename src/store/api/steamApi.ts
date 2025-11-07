import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	SteamInventoryResponse,
	InventoryItem,
	SteamDescription,
} from "../../types/steam";
import { API_CONFIG } from "../../config/api";

// Helper to parse exterior from item name
function parseExterior(name: string): string | undefined {
	const exteriors = [
		"Factory New",
		"Minimal Wear",
		"Field-Tested",
		"Well-Worn",
		"Battle-Scarred",
	];
	for (const exterior of exteriors) {
		if (name.includes(`(${exterior})`)) {
			return exterior;
		}
	}
	return undefined;
}

// Helper to parse rarity from tags
function getRarity(tags: SteamDescription["tags"]): string {
	const rarityTag = tags.find((tag) => tag.category === "Rarity");
	return rarityTag?.localized_tag_name || "Unknown";
}

// Helper to get collection from tags
function getCollection(tags: SteamDescription["tags"]): string | undefined {
	const collectionTag = tags.find((tag) => tag.category === "ItemSet");
	return collectionTag?.localized_tag_name;
}

// Process raw Steam inventory to usable format
function processInventory(response: SteamInventoryResponse): InventoryItem[] {
	const { assets, descriptions } = response;

	return assets
		.map((asset) => {
			const description = descriptions.find(
				(d) =>
					d.classid === asset.classid &&
					d.instanceid === asset.instanceid
			);

			if (!description) return null;

			// Filter: only include CS2 weapon skins that are tradable
			// CS2 weapon types include: Pistol, Rifle, SMG, Sniper Rifle, Shotgun, Machinegun, Knife, Gloves
			const weaponTypes = [
				"Pistol",
				"Rifle",
				"SMG",
				"Sniper Rifle",
				"Shotgun",
				"Machinegun",
				"Knife",
				"Gloves",
			];
			const isWeapon = weaponTypes.some((type) =>
				description.type?.includes(type)
			);

			if (!isWeapon || !description.tradable) return null;

			const item: InventoryItem = {
				assetId: asset.assetid,
				name: description.name,
				marketHashName: description.market_hash_name,
				rarity: getRarity(description.tags),
				type: description.type,
				exterior: parseExterior(description.market_hash_name),
				statTrak: description.market_hash_name.includes("StatTrak™"),
				imageUrl: `https://community.cloudflare.steamstatic.com/economy/image/${description.icon_url}`,
				tradable: description.tradable === 1,
				marketable: description.marketable === 1,
				collection: getCollection(description.tags),
			};

			return item;
		})
		.filter((item): item is InventoryItem => item !== null);
}

export const steamApi = createApi({
	reducerPath: "steamApi",
	baseQuery: fetchBaseQuery({
		baseUrl: "https://steamcommunity.com",
	}),
	tagTypes: ["Inventory"],
	endpoints: (builder) => ({
		// Get Steam inventory
		// Note: This may need CORS proxy in production
		getInventory: builder.query<InventoryItem[], string>({
			async queryFn(steamId, _api, _extraOptions, fetchWithBQ) {
				try {
					const url = `/inventory/${steamId}/730/2?l=english&count=5000`;

					// In production, you might need to use a CORS proxy:
					// const proxiedUrl = API_CONFIG.corsProxy.allOrigins(
					//   `https://steamcommunity.com${url}`
					// )

					const result = await fetchWithBQ(url);

					if (result.error) {
						return { error: result.error };
					}

					const data = result.data as SteamInventoryResponse;

					if (!data.success) {
						return {
							error: {
								status: 400,
								data: "Failed to fetch inventory. Profile might be private.",
							},
						};
					}

					const processedItems = processInventory(data);

					return { data: processedItems };
				} catch (error) {
					return {
						error: {
							status: "FETCH_ERROR",
							error: String(error),
						},
					};
				}
			},
			providesTags: ["Inventory"],
			keepUnusedDataFor: 600, // Cache for 10 minutes
		}),

		// Get inventory from our backend API (recommended method)
		getInventoryWithProxy: builder.query<InventoryItem[], string>({
			async queryFn(steamId) {
				try {
					const backendUrl = `${
						API_CONFIG.backend.baseUrl
					}${API_CONFIG.backend.steam.inventory(steamId)}`;

					console.log(
						`📦 Fetching inventory from backend API: ${backendUrl}`
					);

					const response = await fetch(backendUrl);

					if (!response.ok) {
						const errorData = await response.json();
						console.error(
							`❌ Backend API returned ${response.status}:`,
							errorData.error
						);

						return {
							error: {
								status: "FETCH_ERROR" as const,
								error:
									errorData.error ||
									`Failed to fetch inventory (HTTP ${response.status})`,
							},
						};
					}

					const result = await response.json();

					if (!result.success || !result.data) {
						return {
							error: {
								status: "CUSTOM_ERROR" as const,
								error: "Invalid response from server",
							},
						};
					}

					const data = result.data;

					if (!data.assets || data.assets.length === 0) {
						return {
							error: {
								status: "CUSTOM_ERROR" as const,
								error: "No CS2 items found in inventory. Make sure you have tradable CS2 skins.",
							},
						};
					}

					const processedItems = processInventory(data);

					if (processedItems.length === 0) {
						return {
							error: {
								status: "CUSTOM_ERROR" as const,
								error: "No tradable CS2 weapon skins found in your inventory.",
							},
						};
					}

					console.log(
						`✅ Successfully fetched ${processedItems.length} tradable items from backend!`
					);

					return { data: processedItems };
				} catch (error) {
					const errorMsg =
						error instanceof Error ? error.message : String(error);
					console.error(`❌ Error fetching inventory: ${errorMsg}`);

					return {
						error: {
							status: "FETCH_ERROR" as const,
							error: `Failed to connect to backend API: ${errorMsg}. Make sure the API server is running on http://localhost:5000`,
						},
					};
				}
			},
			providesTags: ["Inventory"],
			keepUnusedDataFor: 600,
		}),
	}),
});

export const {
	useGetInventoryQuery,
	useGetInventoryWithProxyQuery,
	useLazyGetInventoryQuery,
	useLazyGetInventoryWithProxyQuery,
} = steamApi;
