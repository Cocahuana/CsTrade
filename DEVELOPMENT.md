# Development Guide

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Component Overview

### Calculator Flow

```
App
└── Calculator
    ├── CalculatorSettings (toggles & selectors)
    ├── InputsSection
    │   └── InputSkinCard (×10)
    └── OutcomesSection
        └── OutcomeSkinCard (dynamic)
```

## Redux State Structure

```typescript
{
  calculator: {
    inputs: InputSkin[],          // Max 10 items
    outcomes: OutcomeSkin[],      // Calculated outcomes
    fixOutcomePrices: boolean,
    statTrakEnabled: boolean,
    priceSource: string,
    feesApplied: number,
    averageFloat: number,
    adjustedAverageFloat: number,
    tradeUpCost: number,
    profitability: number | null,
    profitPerTradeUp: number | null,
    oddsToProfit: number | null
  }
}
```

## Available Redux Actions

```typescript
// Add a skin to inputs (max 10)
dispatch(addInputSkin(skin));

// Remove a skin by index
dispatch(removeInputSkin(index));

// Update a specific skin
dispatch(updateInputSkin({ index, skin }));

// Toggle settings
dispatch(toggleFixOutcomePrices());
dispatch(toggleStatTrak());

// Update settings
dispatch(setPriceSource("steam" | "skinport" | "buff163"));
dispatch(setFeesApplied(number));

// Calculate outcomes (implement logic)
dispatch(calculateOutcomes());

// Reset everything
dispatch(resetCalculator());
```

## TypeScript Types

### InputSkin

```typescript
{
  id: string
  name: string
  rarity: 'Consumer' | 'Industrial' | 'Mil-Spec' | 'Restricted' | 'Classified' | 'Covert'
  exterior: 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred'
  float: number
  price: number
  statTrak: boolean
  imageUrl?: string
  collection?: string
}
```

### OutcomeSkin

```typescript
{
  id: string
  name: string
  rarity: Rarity
  exterior: Exterior
  minFloat: number
  maxFloat: number
  price: number
  probability: number
  statTrak: boolean
  imageUrl?: string
  collection?: string
}
```

## Adding New Features

### 1. Create a Skin Search Modal

```typescript
// src/components/Calculator/SkinSearchModal.tsx
import { useState } from "react";

interface SkinSearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectSkin: (skin: InputSkin) => void;
}

export default function SkinSearchModal({
	isOpen,
	onClose,
	onSelectSkin,
}: SkinSearchModalProps) {
	// Implement search and selection UI
}
```

### 2. Add RTK Query API

```typescript
// src/store/api/skinsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const skinsApi = createApi({
	reducerPath: "skinsApi",
	baseQuery: fetchBaseQuery({ baseUrl: "https://api.example.com/" }),
	endpoints: (builder) => ({
		searchSkins: builder.query<Skin[], string>({
			query: (searchTerm) => `skins/search?q=${searchTerm}`,
		}),
		getSkinPrice: builder.query<number, string>({
			query: (skinId) => `skins/${skinId}/price`,
		}),
	}),
});

export const { useSearchSkinsQuery, useGetSkinPriceQuery } = skinsApi;
```

### 3. Implement Trade-Up Calculation

```typescript
// src/utils/tradeUpCalculator.ts

export function calculateOutcomes(inputs: InputSkin[]): OutcomeSkin[] {
	// 1. Group inputs by collection
	// 2. Determine possible outcomes (next rarity tier)
	// 3. Calculate probability for each outcome
	// 4. Calculate float ranges
	// 5. Return outcomes array
}

export function calculateProfitability(
	inputs: InputSkin[],
	outcomes: OutcomeSkin[]
): number {
	const totalCost = inputs.reduce((sum, skin) => sum + skin.price, 0);
	const expectedValue = outcomes.reduce(
		(sum, outcome) => sum + outcome.price * outcome.probability,
		0
	);
	return ((expectedValue - totalCost) / totalCost) * 100;
}

export function calculateOddsToProfit(
	inputs: InputSkin[],
	outcomes: OutcomeSkin[]
): number {
	const totalCost = inputs.reduce((sum, skin) => sum + skin.price, 0);
	const profitableOutcomes = outcomes.filter(
		(outcome) => outcome.price > totalCost
	);
	return (
		profitableOutcomes.reduce(
			(sum, outcome) => sum + outcome.probability,
			0
		) * 100
	);
}
```

## CS2 Trade-Up Rules

### Float Calculation (New Formula)

The new CS2 trade-up formula (as of recent updates):

-   Outcome float is calculated based on input floats and their ranges
-   Each skin contributes to the outcome float calculation
-   Formula involves average input float and outcome float ranges

### Probability Calculation

-   Probability is based on the number of skins from each collection
-   If you have 7 skins from Collection A and 3 from Collection B:
    -   Outcomes from Collection A have 70% probability
    -   Outcomes from Collection B have 30% probability

### Rarity Tiers

Trade-ups always produce the next rarity tier:

-   10× Consumer → Industrial
-   10× Industrial → Mil-Spec
-   10× Mil-Spec → Restricted
-   10× Restricted → Classified
-   10× Classified → Covert

## Tailwind Utilities Reference

### Common Patterns Used

```typescript
// Card
className = "bg-slate-800 rounded-lg p-6 border border-slate-700";

// Button Primary
className = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded";

// Button Danger
className = "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded";

// Input
className =
	"bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500";

// Toggle Switch
className = "relative w-12 h-6 rounded-full bg-blue-600";

// Grid Layout
className = "grid grid-cols-1 lg:grid-cols-2 gap-6";
```

## API Integration Examples

### Steam Market API

```typescript
const fetchSteamPrice = async (marketHashName: string) => {
	const response = await fetch(
		`https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${marketHashName}`
	);
	return response.json();
};
```

### Mock Data for Testing

See `src/data/mockData.ts` for example skin data structures.

## Performance Tips

1. **Memoize expensive calculations**:

```typescript
import { useMemo } from "react";

const outcomes = useMemo(() => calculateOutcomes(inputs), [inputs]);
```

2. **Use React.memo for list items**:

```typescript
export default React.memo(InputSkinCard);
```

3. **Debounce search inputs**:

```typescript
import { debounce } from "lodash";

const debouncedSearch = useMemo(
	() => debounce((term: string) => searchSkins(term), 300),
	[]
);
```

## Testing

Add tests for:

-   Trade-up calculation logic
-   Probability calculations
-   Float calculations
-   Component rendering
-   Redux state updates

## Deployment

```bash
# Build
npm run build

# Preview build
npm run preview

# Deploy to Vercel/Netlify/etc
# Just point to the dist folder
```

Happy coding! 🚀
