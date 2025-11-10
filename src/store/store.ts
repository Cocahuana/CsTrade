import { configureStore } from "@reduxjs/toolkit";
import calculatorReducer from "./slices/calculatorSlice";
import optimizerReducer from "./slices/optimizerSlice";
import cs2ItemsReducer from "./slices/cs2ItemsSlice";
import casesReducer from "./slices/casesSlice";
import { steamApi } from "./api/steamApi";
import { pricesApi } from "./api/pricesApi";

export const store = configureStore({
	reducer: {
		calculator: calculatorReducer,
		optimizer: optimizerReducer,
		cs2Items: cs2ItemsReducer,
		cases: casesReducer,
		[steamApi.reducerPath]: steamApi.reducer,
		[pricesApi.reducerPath]: pricesApi.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware()
			.concat(steamApi.middleware)
			.concat(pricesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
