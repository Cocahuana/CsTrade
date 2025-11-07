# CS Trades - Trade Up Calculator

A React-based web application for calculating CS2 (Counter-Strike 2) trade-up contracts, inspired by TradeUpSpy.

## Tech Stack

-   **React 19** - Latest React version
-   **TypeScript** - Type-safe development
-   **Tailwind CSS** - Utility-first styling
-   **Redux Toolkit & RTK Query** - State management and API calls
-   **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites

-   Node.js 18+ and npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build
-   `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   └── Calculator/      # Calculator components
├── store/
│   ├── slices/         # Redux slices
│   └── store.ts        # Redux store configuration
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## Features (Planned)

-   [x] Calculator view structure
-   [ ] Add input skins with search
-   [ ] Calculate trade-up outcomes
-   [ ] Display probability calculations
-   [ ] Price integration from multiple sources
-   [ ] Save favorite trade-ups
-   [ ] Trade-up tracker
-   [ ] Statistics and analytics

## License

MIT
