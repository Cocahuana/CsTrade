import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { SkinportResponse, PriceData } from "../../types/steam";
import { API_CONFIG } from "../../config/api";

export const pricesApi = createApi({
	reducerPath: "pricesApi",
	baseQuery: fetchBaseQuery({ baseUrl: API_CONFIG.skinport.baseUrl }),
	tagTypes: ["Prices"],
	endpoints: (builder) => ({
		// Get all Skinport items (cached for 5 minutes)
		getSkinportPrices: builder.query<SkinportResponse, void>({
			query: () => ({
				url: "/items",
				params: {
					app_id: 730,
					currency: "USD",
				},
			}),
			providesTags: ["Prices"],
			// Cache for 5 minutes
			keepUnusedDataFor: 300,
		}),

		// Get price for a specific item
		getItemPrice: builder.query<PriceData, string>({
			async queryFn(marketHashName, _api, _extraOptions, baseQuery) {
				try {
					// First try Skinport
					const skinportResult = await baseQuery({
						url: "/items",
						params: {
							app_id: 730,
							currency: "USD",
						},
					});

					if (skinportResult.data) {
						const data = skinportResult.data as SkinportResponse;
						const item = data.items?.find(
							(i) => i.market_hash_name === marketHashName
						);

						if (item) {
							return {
								data: {
									marketHashName,
									price:
										item.suggested_price || item.min_price,
									lowestPrice: item.min_price,
									medianPrice: item.median_price,
									source: "skinport" as const,
									timestamp: Date.now(),
								},
							};
						}
					}

					// Fallback: return cached or error
					return {
						error: {
							status: 404,
							data: `Price not found for ${marketHashName}`,
						},
					};
				} catch (error) {
					return {
						error: {
							status: "FETCH_ERROR",
							error: String(error),
						},
					};
				}
			},
			keepUnusedDataFor: 300, // 5 minutes
		}),

		// Batch get prices for multiple items
		getBatchPrices: builder.query<Record<string, PriceData>, string[]>({
			async queryFn(marketHashNames, _api, _extraOptions, baseQuery) {
				try {
					const skinportResult = await baseQuery({
						url: "/items",
						params: {
							app_id: 730,
							currency: "USD",
						},
					});

					if (!skinportResult.data) {
						return {
							error: {
								status: 500,
								data: "Failed to fetch prices",
							},
						};
					}

					const data = skinportResult.data as SkinportResponse;
					const priceMap: Record<string, PriceData> = {};

					marketHashNames.forEach((marketHashName) => {
						const item = data.items?.find(
							(i) => i.market_hash_name === marketHashName
						);

						if (item) {
							priceMap[marketHashName] = {
								marketHashName,
								price: item.suggested_price || item.min_price,
								lowestPrice: item.min_price,
								medianPrice: item.median_price,
								source: "skinport",
								timestamp: Date.now(),
							};
						}
					});

					return { data: priceMap };
				} catch (error) {
					return {
						error: {
							status: "FETCH_ERROR",
							error: String(error),
						},
					};
				}
			},
			keepUnusedDataFor: 300,
		}),
	}),
});

export const {
	useGetSkinportPricesQuery,
	useGetItemPriceQuery,
	useGetBatchPricesQuery,
	useLazyGetItemPriceQuery,
	useLazyGetBatchPricesQuery,
} = pricesApi;
