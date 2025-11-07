# CS2 Inventory Trade-Up Optimizer - Implementation Plan

## Feature Overview

**Goal**: Automatically analyze a user's CS2 inventory and suggest the most profitable trade-up combinations.

## API Options Research

### 1. Steam Inventory API

**Official Steam API**

-   Endpoint: `https://steamcommunity.com/inventory/{steamId}/730/2?l=english&count=5000`
-   **Pros**: Free, official, comprehensive
-   **Cons**: Requires Steam API key, CORS issues (needs proxy)
-   **Authentication**: Steam OpenID or API key

**Alternative: Steam Web API**

-   `https://api.steampowered.com/IEconItems_730/GetPlayerItems/v1/`
-   Requires Steam API key

### 2. Price APIs

**Option A: Steam Market API** (Free)

-   `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name={name}`
-   **Pros**: Official prices
-   **Cons**: Rate limited, CORS issues

**Option B: CS2 Float / CSGOFloat API** (Free tier available)

-   `https://csgofloat.com/api/v1/listings`
-   Better float data, no CORS
-   API key needed for higher limits

**Option C: Skinport API** (Free)

-   `https://api.skinport.com/v1/items`
-   Good pricing data
-   No authentication for basic requests

**Option D: CS2 Backpack.tf / CSGOBackpack**

-   Community-driven prices
-   May have better availability

### 3. Skin Metadata APIs

**Option A: CS2 Items Database**

-   Various open-source databases on GitHub
-   Collections, rarities, float ranges
-   Can be bundled as static JSON

**Option B: Steam Item Schema**

-   Official item definitions
-   Collections and rarity data

## Recommended Approach

### Phase 1: API Integration (Start Here)

1. **Create proxy endpoint** to avoid CORS (or use a CORS proxy service)
2. **Implement Skinport API** for pricing (no auth needed initially)
3. **Bundle static skin database** for collections/rarities (faster, no API calls)
4. **Steam inventory via proxy** for fetching user items

### Phase 2: Trade-Up Optimizer Algorithm

Calculate best combinations based on:

-   **Expected Value (EV)**: `Σ(outcome_price × probability) - input_cost`
-   **Profitability**: `(EV - cost) / cost × 100`
-   **Risk**: Variance in outcomes
-   **Collection grouping**: Find same-rarity items from similar collections

### Phase 3: UI Implementation

-   Steam login button
-   Inventory grid display
-   "Analyze Inventory" button
-   Results showing top 5-10 suggested trade-ups
-   Detailed breakdown per suggestion

## Implementation Strategy

### Approach 1: Start with API Setup ✅ RECOMMENDED

**Advantages**:

-   Get real data flowing first
-   Test with actual Steam inventory
-   Validate API responses before building complex logic

**Steps**:

1. Set up RTK Query API slices
2. Create proxy/CORS solution
3. Test fetching inventory and prices
4. Then build optimizer algorithm

### Approach 2: Start with Algorithm

**Advantages**:

-   Can use mock data to develop logic
-   Algorithm ready when APIs connect

**Disadvantages**:

-   Might need adjustments based on actual API data structure

## Recommended First Steps

I suggest **Approach 1** - Let's build the API infrastructure first:

1. ✅ Create RTK Query API services
2. ✅ Set up CORS proxy or backend endpoint
3. ✅ Test inventory fetching
4. ✅ Test price fetching
5. ⏭️ Build optimizer algorithm with real data
6. ⏭️ Create UI components

---

## Code Structure Preview

```
src/
├── store/
│   ├── api/
│   │   ├── steamApi.ts          # Steam inventory
│   │   ├── pricesApi.ts         # Price fetching
│   │   └── skinsApi.ts          # Skin metadata
│   └── slices/
│       ├── calculatorSlice.ts   # Existing
│       └── optimizerSlice.ts    # New: optimizer state
├── utils/
│   ├── tradeUpCalculator.ts     # Trade-up math
│   └── inventoryOptimizer.ts    # NEW: Optimization algorithm
├── components/
│   ├── Calculator/              # Existing
│   └── InventoryAnalyzer/       # NEW
│       ├── InventoryAnalyzer.tsx
│       ├── SteamLoginButton.tsx
│       ├── InventoryGrid.tsx
│       └── OptimalTradeUpCard.tsx
└── data/
    └── skinsDatabase.json       # Static skin metadata
```

Would you like me to:
**A) Start with API setup** (RTK Query, proxy, test endpoints)
**B) Start with the optimizer algorithm** (using mock data)
**C) Create both in parallel**

I recommend **Option A** to ensure we have real data before building complex logic.
