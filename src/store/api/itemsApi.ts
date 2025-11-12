import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface PriceRange {
	min: number;
	max: number;
	count: number;
}

export interface ItemPriceRange {
	normal: PriceRange | null;
	statTrak: PriceRange | null;
}

export interface CollectionInfo {
	id: number;
	name: string;
}

export interface ItemWithPrices {
	id: number;
	name: string;
	exterior?: string;
	imageUrl?: string;
	priceRange: ItemPriceRange;
	collection: CollectionInfo | null;
	createdAt: string;
	updatedAt: string;
}

export interface ItemsResponse {
	items: ItemWithPrices[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface PriceVariant {
	marketHashName: string;
	price: string;
	lowestPrice: string | null;
	medianPrice: string | null;
	exterior: string | null;
	imageUrl: string | null;
}

export interface ItemDetailResponse {
	id: number;
	name: string;
	exterior?: string;
	imageUrl?: string;
	prices: {
		normal: PriceVariant[];
		statTrak: PriceVariant[];
	};
	collection: CollectionInfo | null;
	createdAt: string;
	updatedAt: string;
}

export const itemsApi = createApi({
	reducerPath: "itemsApi",
	baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}` }),
	tagTypes: ["Items"],
	endpoints: (builder) => ({
		getItems: builder.query<
			ItemsResponse,
			{
				page?: number;
				limit?: number;
				search?: string;
				collectionId?: number;
				hasPrice?: boolean;
			}
		>({
			query: ({
				page = 1,
				limit = 50,
				search,
				collectionId,
				hasPrice,
			}) => {
				const params = new URLSearchParams({
					page: page.toString(),
					limit: limit.toString(),
				});

				if (search) params.append("search", search);
				if (collectionId)
					params.append("collectionId", collectionId.toString());
				if (hasPrice) params.append("hasPrice", "true");

				return `/items?${params.toString()}`;
			},
			providesTags: ["Items"],
		}),

		getItemById: builder.query<ItemDetailResponse, number>({
			query: (id) => `/items/${id}`,
			providesTags: (_result, _error, id) => [{ type: "Items", id }],
		}),
	}),
});

export const { useGetItemsQuery, useGetItemByIdQuery, useLazyGetItemsQuery } =
	itemsApi;
