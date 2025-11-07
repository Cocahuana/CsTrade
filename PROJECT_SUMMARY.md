# CS Trades Project - Setup Complete! 🎉

## What We've Built

A modern React application foundation for a CS2 Trade-Up Calculator, inspired by TradeUpSpy. The calculator view structure is complete and ready for you to add the actual skin data and API integrations.

## Tech Stack

-   **React 18.3** with TypeScript
-   **Vite** - Lightning-fast dev server and build tool
-   **Tailwind CSS** - Utility-first styling with dark theme
-   **Redux Toolkit** - State management
-   **RTK Query** - Ready for API integrations

## Project Structure

```
csTrades/
├── src/
│   ├── components/
│   │   └── Calculator/
│   │       ├── Calculator.tsx              # Main calculator component
│   │       ├── CalculatorSettings.tsx      # Settings toggles
│   │       ├── InputsSection.tsx           # Input skins grid (10 slots)
│   │       ├── InputSkinCard.tsx           # Individual input skin card
│   │       ├── OutcomesSection.tsx         # Outcomes display with stats
│   │       └── OutcomeSkinCard.tsx         # Individual outcome card
│   ├── store/
│   │   ├── slices/
│   │   │   └── calculatorSlice.ts          # Calculator state management
│   │   └── store.ts                        # Redux store config
│   ├── types/
│   │   └── calculator.ts                   # TypeScript definitions
│   ├── App.tsx                             # Main app with header/nav
│   ├── main.tsx                            # Entry point
│   └── index.css                           # Tailwind + custom styles
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Features Implemented

### Calculator View ✅

1. **Header Section**

    - Project title and description
    - Navigation placeholder (Calculator, Trade Ups, Tracker)

2. **Settings Panel**

    - Fix outcome prices toggle
    - StatTrak™ toggle
    - Price source selector (Steam, Skinport, Buff163)
    - Fees applied (% input)

3. **Inputs Section**

    - 10 input slots for skins
    - Add/Remove functionality
    - Skin cards showing:
        - Name, rarity, exterior
        - Float value
        - Price
        - StatTrak badge

4. **Outcomes Section**

    - Statistics display:
        - Average Float
        - Adjusted Average Float
        - Trade Up Cost
        - Profitability
        - Profit/TradeUp
        - Odds to Profit
    - Outcome skins list with probabilities

5. **Redux State Management**
    - Calculator slice with all actions
    - TypeScript-safe state
    - Ready for RTK Query integration

## Next Steps

To get the project running, you need to:

1. **Install Dependencies**:

    ```bash
    cd "d:\0-Trabajos\Personal Projects\csTrades"
    npm install
    ```

2. **Start Development Server**:

    ```bash
    npm run dev
    ```

    The app will run on `http://localhost:5173`

3. **Next Features to Build**:
    - [ ] Add skin search/selection modal
    - [ ] Integrate with CS2 skin API (prices, images, float ranges)
    - [ ] Implement actual trade-up calculation logic
    - [ ] Add RTK Query for API calls
    - [ ] Save favorite trade-ups (localStorage or backend)
    - [ ] Add trade-up tracker page
    - [ ] Implement statistics page
    - [ ] Add authentication (optional)

## Calculator Logic to Implement

The main calculations needed:

1. **Outcome Probabilities**: Based on input skin collections
2. **Float Calculation**: New CS2 formula for outcome float ranges
3. **Profitability**: Compare input cost vs outcome expected value
4. **Odds to Profit**: Percentage chance of profitable outcome

## API Integration Suggestions

Consider using:

-   **Steam Market API** for prices
-   **CS2 Skins Database** for skin metadata
-   **Third-party APIs** (CSGOFloat, Skinport, etc.)

## Design Notes

The current design uses:

-   **Dark theme** (slate-900 background)
-   **Blue accents** for primary actions
-   **Color-coded rarities**:
    -   Consumer: Gray
    -   Industrial: Blue
    -   Mil-Spec: Blue
    -   Restricted: Purple
    -   Classified: Pink
    -   Covert: Red

## Ready to Code!

The foundation is solid. You can now focus on:

1. Adding real skin data
2. Implementing calculation algorithms
3. Building the search/selection UI
4. Adding more pages (Tracker, Stats, etc.)

Run `npm run dev` and start building! 🚀
