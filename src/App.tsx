import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
	fetchCS2Items,
	fetchCollectionItems,
} from "./store/slices/cs2ItemsSlice";
import type { AppDispatch } from "./store/store";
import Calculator from "./components/Calculator/Calculator";
import TradeUpCalculator from "./components/TradeUpCalculator/TradeUpCalculator";
import InventoryAnalyzer from "./components/InventoryAnalyzer/InventoryAnalyzer";
type View = "calculator" | "analyzer" | "tradeup" | "tracker";

function App() {
	const [currentView, setCurrentView] = useState<View>("calculator");
	const dispatch = useDispatch<AppDispatch>();

	// Fetch CS2 items metadata and collection items on app initialization
	useEffect(() => {
		console.log("🎮 Loading CS2 metadata...");
		dispatch(fetchCS2Items());
		dispatch(fetchCollectionItems());
	}, [dispatch]);

	return (
		<div className='min-h-screen bg-slate-900'>
			<header className='bg-slate-800 border-b border-slate-700'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center justify-between'>
						<h1 className='text-2xl font-bold text-white'>
							CS Trades
						</h1>
						<nav className='flex gap-6'>
							<button
								onClick={() => setCurrentView("calculator")}
								className={`transition-colors ${
									currentView === "calculator"
										? "text-blue-400 hover:text-blue-300"
										: "text-slate-400 hover:text-slate-300"
								}`}
							>
								Calculator
							</button>
							<button
								onClick={() => setCurrentView("analyzer")}
								className={`transition-colors ${
									currentView === "analyzer"
										? "text-blue-400 hover:text-blue-300"
										: "text-slate-400 hover:text-slate-300"
								}`}
							>
								Inventory Analyzer
							</button>
							<button
								onClick={() => setCurrentView("tradeup")}
								className={`transition-colors ${
									currentView === "tradeup"
										? "text-blue-400 hover:text-blue-300"
										: "text-slate-400 hover:text-slate-300"
								}`}
							>
								Trade-Up Builder
							</button>
							<button
								onClick={() => setCurrentView("tracker")}
								className={`transition-colors ${
									currentView === "tracker"
										? "text-blue-400 hover:text-blue-300"
										: "text-slate-400 hover:text-slate-300"
								}`}
							>
								Tracker
							</button>
						</nav>
					</div>
				</div>
			</header>

			<main className='container mx-auto px-4 py-8'>
				{currentView === "calculator" && <Calculator />}
				{currentView === "analyzer" && <InventoryAnalyzer />}
				{currentView === "tradeup" && <TradeUpCalculator />}
				{currentView === "tracker" && (
					<div className='bg-slate-800 rounded-lg p-12 border border-slate-700 text-center'>
						<h3 className='text-xl font-semibold text-white mb-2'>
							Tracker Coming Soon
						</h3>
						<p className='text-slate-400'>
							This feature is under development
						</p>
					</div>
				)}
			</main>
		</div>
	);
}

export default App;
