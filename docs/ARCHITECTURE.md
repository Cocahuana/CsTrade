# CS2 Custom Cases Platform - Architecture

## Overview

A community-driven platform where users create custom CS2 skin cases with transparent drop rates and fixed pricing. Not a gambling platform - all probabilities are public and verifiable.

---

## System Architecture

### Tech Stack

-   **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Shadcn/UI
-   **Backend**: Node.js + Express.js
-   **Database**: PostgreSQL
-   **Authentication**: Steam OpenID
-   **File Storage**: AWS S3 / Cloudinary (for case images)
-   **Cache**: Redis (optional, for session management)

### High-Level Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend)     │
│  - Public Pages │
│  - User Dashboard│
│  - Case Browser │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│  Express.js API │
│  - Auth Routes  │
│  - Case Routes  │
│  - User Routes  │
│  - Opening Logic│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│   PostgreSQL    │────▶│    Redis     │
│  - Users        │     │  (Sessions)  │
│  - Cases        │     └──────────────┘
│  - Items        │
│  - Openings     │
│  - Transactions │
└─────────────────┘
```

---

## Database Schema

### 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  balance_credits INTEGER DEFAULT 0, -- 1 USD = 100 credits
  total_earned_credits INTEGER DEFAULT 0, -- Lifetime earnings as creator
  total_spent_credits INTEGER DEFAULT 0, -- Lifetime spending
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT balance_non_negative CHECK (balance_credits >= 0)
);

CREATE INDEX idx_users_steam_id ON users(steam_id);
```

### 2. Cases Table

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id INTEGER REFERENCES collections(id), -- Link to CS2 collection

  -- Case Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  price_credits INTEGER NOT NULL, -- Fixed price to open (e.g., 100 credits = $1)

  -- Stats
  times_opened INTEGER DEFAULT 0,
  total_revenue_credits INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT price_positive CHECK (price_credits > 0)
);

CREATE INDEX idx_cases_creator ON cases(creator_id);
CREATE INDEX idx_cases_active ON cases(is_active);
CREATE INDEX idx_cases_featured ON cases(is_featured);
```

### 3. Case Items Table (Items in each case)

```sql
CREATE TABLE case_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id), -- From your existing items table

  -- Drop probability (must sum to 100 for each case)
  drop_chance_percentage DECIMAL(5,2) NOT NULL, -- e.g., 15.50%

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT drop_chance_valid CHECK (drop_chance_percentage > 0 AND drop_chance_percentage <= 100),
  UNIQUE(case_id, item_id)
);

CREATE INDEX idx_case_items_case ON case_items(case_id);
```

### 4. Case Openings Table (History)

```sql
CREATE TABLE case_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  user_id UUID NOT NULL REFERENCES users(id),
  item_won_id INTEGER NOT NULL REFERENCES items(id),

  -- Financial details
  credits_spent INTEGER NOT NULL,
  item_value_credits INTEGER NOT NULL, -- Price of won item at time of opening

  -- Transaction breakdown
  platform_fee_credits INTEGER NOT NULL, -- 10%
  creator_fee_credits INTEGER NOT NULL, -- 15%
  pool_contribution_credits INTEGER NOT NULL, -- 75%

  opened_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_openings_user ON case_openings(user_id);
CREATE INDEX idx_openings_case ON case_openings(case_id);
CREATE INDEX idx_openings_date ON case_openings(opened_at);
```

### 5. Transactions Table (Credit movements)

```sql
CREATE TYPE transaction_type AS ENUM (
  'deposit',           -- User adds credits
  'case_opening',      -- User opens a case
  'creator_earnings',  -- Creator receives fee
  'platform_fee',      -- Platform commission
  'withdrawal',        -- User withdraws (future feature)
  'refund'             -- Refund credits
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type transaction_type NOT NULL,
  amount_credits INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- References
  case_opening_id UUID REFERENCES case_openings(id),
  related_case_id UUID REFERENCES cases(id),

  -- Metadata
  description TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(created_at);
```

### 6. User Inventory Table (Owned skins from openings)

```sql
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  case_opening_id UUID REFERENCES case_openings(id),

  -- Value at acquisition
  acquired_value_credits INTEGER NOT NULL,
  current_value_credits INTEGER, -- Updated periodically

  -- Status
  is_tradeable BOOLEAN DEFAULT true,
  is_listed_for_sale BOOLEAN DEFAULT false,

  acquired_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, case_opening_id) -- One item per opening
);

CREATE INDEX idx_inventory_user ON user_inventory(user_id);
```

---

## Backend API Endpoints

### Authentication Routes (`/api/auth`)

#### POST /api/auth/steam

```javascript
// Initiate Steam OpenID login
// Returns: Redirect URL to Steam
```

#### GET /api/auth/steam/callback

```javascript
// Handle Steam callback
// Creates/updates user session
// Returns: JWT token + user info
```

#### GET /api/auth/me

```javascript
// Get current authenticated user
// Returns: User object with balance
```

#### POST /api/auth/logout

```javascript
// Invalidate session
```

### User Routes (`/api/users`)

#### GET /api/users/me

```javascript
// Get current user profile + stats
Response: {
  user: { id, username, avatar, balance_credits },
  stats: {
    total_openings: 150,
    total_created_cases: 5,
    total_earned: 5000,
    inventory_value: 12000
  }
}
```

#### GET /api/users/:id

```javascript
// Get public user profile
```

#### GET /api/users/me/inventory

```javascript
// Get user's inventory
Query params: ?page=1&limit=20&sort=value_desc
Response: {
  items: [{ id, item_name, rarity, value, acquired_at }],
  pagination: { total, page, pages }
}
```

#### GET /api/users/me/transactions

```javascript
// Get transaction history
```

#### POST /api/users/me/credits/add

```javascript
// Add credits (payment integration later)
Body: {
	amount_usd: 10.0;
}
Response: {
	new_balance: 1000;
}
```

### Case Routes (`/api/cases`)

#### GET /api/cases

```javascript
// Browse all active cases
Query params: ?page=1&limit=20&featured=true&collection_id=5&sort=popular
Response: {
  cases: [{
    id, title, description, image, price_credits,
    times_opened, creator: { username, avatar },
    collection: { name },
    expected_value: 120 // Average value of items
  }],
  pagination: { total, page, pages }
}
```

#### GET /api/cases/:id

```javascript
// Get case details with items
Response: {
  case: { id, title, description, price_credits, ... },
  items: [{
    id, name, rarity, price, image, drop_chance: 15.50
  }],
  stats: {
    times_opened: 245,
    expected_value: 120,
    house_edge: 20 // (price - expected_value) / price * 100
  }
}
```

#### POST /api/cases

```javascript
// Create new case (authenticated)
Body: {
  title: "My Epic Case",
  description: "Contains rare AK skins",
  collection_id: 5,
  price_credits: 100,
  image_url: "https://...",
  items: [
    { item_id: 123, drop_chance: 50.00 },
    { item_id: 124, drop_chance: 30.00 },
    { item_id: 125, drop_chance: 20.00 }
  ]
}

Validations:
- Sum of drop chances MUST equal 100
- Minimum 3 items, maximum 20 items
- All items must be from the same collection
- Creator must verify probabilities
```

#### PUT /api/cases/:id

```javascript
// Update case (only by creator, only if not opened yet)
```

#### DELETE /api/cases/:id

```javascript
// Deactivate case (only by creator)
```

#### GET /api/cases/:id/openings

```javascript
// Get opening history for a case
Query: ?page=1&limit=50
```

### Case Opening Routes (`/api/openings`)

#### POST /api/openings

```javascript
// Open a case
Body: {
  case_id: "uuid",
  quantity: 1 // For future: open multiple at once
}

Process:
1. Validate user has enough credits
2. Deduct credits from balance
3. Generate random number (0-100) using cryptographically secure RNG
4. Select item based on drop chances
5. Create opening record
6. Add item to user inventory
7. Distribute fees (platform, creator, pool)
8. Create transaction records
9. Update case stats

Response: {
  opening_id: "uuid",
  item_won: { id, name, rarity, price, image },
  value_credits: 150,
  new_balance: 850
}
```

#### GET /api/openings/me

```javascript
// Get user's opening history
```

#### GET /api/openings/recent

```javascript
// Get recent global openings (for activity feed)
Query: ?limit=50
```

### Creator Dashboard Routes (`/api/creator`)

#### GET /api/creator/cases

```javascript
// Get creator's cases with stats
Response: [
	{
		id,
		title,
		price_credits,
		times_opened: 500,
		total_revenue: 50000,
		creator_earnings: 7500, // 15% of revenue
		avg_opening_value: 125,
	},
];
```

#### GET /api/creator/earnings

```javascript
// Get earnings breakdown
Response: {
  total_earnings: 25000,
  pending_withdrawal: 25000,
  by_case: [{ case_id, case_title, earnings: 5000 }],
  recent_transactions: [...]
}
```

---

## Business Logic & Calculations

### 1. Probability Calculation Algorithm

```javascript
// When creating a case, suggest fair probabilities based on item values
function calculateFairProbabilities(items, casePrice) {
	const totalValue = items.reduce((sum, item) => sum + item.price, 0);

	// Calculate probabilities inversely proportional to value
	const probabilities = items.map((item) => {
		// Items with lower value = higher drop chance
		const inverseValue = 1 / item.price;
		return inverseValue;
	});

	// Normalize to sum to 100%
	const totalInverse = probabilities.reduce((sum, p) => sum + p, 0);
	const normalized = probabilities.map((p) => (p / totalInverse) * 100);

	// Calculate expected value
	const expectedValue = items.reduce((sum, item, i) => {
		return sum + (item.price * normalized[i]) / 100;
	}, 0);

	// House edge (platform margin)
	const houseEdge = ((casePrice - expectedValue) / casePrice) * 100;

	return {
		probabilities: normalized.map((p, i) => ({
			item_id: items[i].id,
			drop_chance: p.toFixed(2),
		})),
		expectedValue,
		houseEdge,
		isReasonable: houseEdge >= 10 && houseEdge <= 40, // Recommended range
	};
}
```

### 2. Item Selection Algorithm (Provably Fair)

```javascript
const crypto = require("crypto");

function selectItemFromCase(caseItems) {
	// Generate cryptographically secure random number
	const randomBytes = crypto.randomBytes(4);
	const randomNumber = (randomBytes.readUInt32BE(0) / 0xffffffff) * 100;

	// Sort items by drop chance (cumulative)
	let cumulative = 0;
	const ranges = caseItems.map((item) => {
		const start = cumulative;
		cumulative += parseFloat(item.drop_chance_percentage);
		return {
			item_id: item.item_id,
			start,
			end: cumulative,
		};
	});

	// Find which item was selected
	const selected = ranges.find(
		(r) => randomNumber >= r.start && randomNumber < r.end
	);

	return {
		item_id: selected.item_id,
		random_value: randomNumber,
		seed: randomBytes.toString("hex"), // For verification
	};
}
```

### 3. Fee Distribution

```javascript
function distributeFees(openingPrice, creatorId, platformId) {
	const platformFee = Math.floor(openingPrice * 0.1); // 10%
	const creatorFee = Math.floor(openingPrice * 0.15); // 15%
	const poolContribution = openingPrice - platformFee - creatorFee; // 75%

	return {
		platform_fee_credits: platformFee,
		creator_fee_credits: creatorFee,
		pool_contribution_credits: poolContribution,
	};
}
```

---

## Frontend Structure (Next.js)

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx           # Steam login page
│   └── callback/
│       └── page.tsx           # Steam OAuth callback
├── (public)/
│   ├── page.tsx               # Homepage (featured cases)
│   ├── cases/
│   │   ├── page.tsx           # Browse all cases
│   │   └── [id]/
│   │       └── page.tsx       # Case detail + open
│   ├── collections/
│   │   └── [id]/
│   │       └── page.tsx       # Collection view
│   └── leaderboard/
│       └── page.tsx           # Top creators, luckiest users
├── (dashboard)/
│   ├── profile/
│   │   └── page.tsx           # User profile + stats
│   ├── inventory/
│   │   └── page.tsx           # User's items
│   ├── history/
│   │   └── page.tsx           # Opening history
│   ├── create-case/
│   │   └── page.tsx           # Case creation wizard
│   └── creator/
│       ├── page.tsx           # Creator dashboard
│       └── cases/[id]/
│           └── page.tsx       # Case analytics
└── api/
    └── [...all API routes proxy to Express backend]

components/
├── cases/
│   ├── CaseCard.tsx           # Case preview card
│   ├── CaseOpening.tsx        # Opening animation
│   └── CaseItemList.tsx       # Items with probabilities
├── items/
│   ├── ItemCard.tsx           # Skin display
│   └── RarityBadge.tsx        # Rarity indicator
├── layout/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── UserBalance.tsx        # Credits display
└── ui/                        # Shadcn components
```

---

## Key Features Implementation

### 1. Case Creation Wizard (Frontend)

```typescript
// app/(dashboard)/create-case/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemSelector } from "@/components/cases/ItemSelector";

export default function CreateCasePage() {
	const [step, setStep] = useState(1);
	const [caseData, setCaseData] = useState({
		title: "",
		description: "",
		collection_id: null,
		price_credits: 100,
		items: [],
	});

	const steps = [
		"Basic Info",
		"Select Collection",
		"Add Items",
		"Set Probabilities",
		"Review & Publish",
	];

	// Step 4: Probability calculator
	const suggestProbabilities = () => {
		// Call backend API to calculate fair probabilities
		fetch("/api/cases/calculate-probabilities", {
			method: "POST",
			body: JSON.stringify({
				items: caseData.items,
				price: caseData.price_credits,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				// Update items with suggested probabilities
				setCaseData({
					...caseData,
					items: data.probabilities,
				});
			});
	};

	return <div className='max-w-4xl mx-auto p-6'>{/* Multi-step form */}</div>;
}
```

### 2. Case Opening Animation

```typescript
// components/cases/CaseOpening.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CaseOpening({ caseId, onComplete }) {
	const [isSpinning, setIsSpinning] = useState(false);
	const [wonItem, setWonItem] = useState(null);

	const openCase = async () => {
		setIsSpinning(true);

		const response = await fetch("/api/openings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ case_id: caseId }),
		});

		const result = await response.json();

		// Simulate spinning animation
		setTimeout(() => {
			setIsSpinning(false);
			setWonItem(result.item_won);
			onComplete(result);
		}, 3000);
	};

	return (
		<div className='relative'>
			<AnimatePresence>
				{isSpinning ? (
					<motion.div
						className='roulette-animation'
						animate={{ x: [-2000, 0] }}
						transition={{ duration: 3, ease: "easeOut" }}
					>
						{/* Scrolling items */}
					</motion.div>
				) : wonItem ? (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className='won-item'
					>
						<h2>You won!</h2>
						<img src={wonItem.image} alt={wonItem.name} />
						<p>{wonItem.name}</p>
						<p className='value'>{wonItem.price} credits</p>
					</motion.div>
				) : (
					<Button onClick={openCase}>Open Case</Button>
				)}
			</AnimatePresence>
		</div>
	);
}
```

---

## Security & Legal Considerations

### 1. Anti-Gambling Measures

```javascript
// Implement these to stay compliant:

// - Public probabilities (always visible)
// - No random loot boxes (all cases are user-created)
// - No real money withdrawals (credits only)
// - Age verification (18+)
// - Transparent house edge calculation
// - Provably fair system with verifiable seeds
```

### 2. Rate Limiting

```javascript
// Prevent abuse
app.use(
	"/api/openings",
	rateLimit({
		windowMs: 60 * 1000, // 1 minute
		max: 10, // Max 10 openings per minute
	})
);
```

### 3. Input Validation

```javascript
// Validate all case creation inputs
const createCaseSchema = z.object({
	title: z.string().min(5).max(100),
	price_credits: z.number().min(50).max(10000),
	items: z
		.array(
			z.object({
				item_id: z.number(),
				drop_chance: z.number().min(0.01).max(100),
			})
		)
		.min(3)
		.max(20)
		.refine(
			(items) => items.reduce((sum, i) => sum + i.drop_chance, 0) === 100,
			{ message: "Probabilities must sum to 100%" }
		),
});
```

---

## Future Features Roadmap

### Phase 1 (MVP)

-   ✅ Steam authentication
-   ✅ Case creation & browsing
-   ✅ Case opening with probabilities
-   ✅ Basic inventory system
-   ✅ Creator earnings

### Phase 2

-   🔄 **Marketplace**: Users can sell inventory items to each other
-   🔄 **Trading**: Direct item-for-item trades
-   🔄 **Case Templates**: Popular case configurations
-   🔄 **Social Features**: Comments, ratings on cases
-   🔄 **Achievements**: Badges for milestones

### Phase 3

-   🔄 **Battle Mode**: 2+ users open same case, best item wins
-   🔄 **Contracts**: Combine multiple items for a chance at better item
-   🔄 **Seasonal Events**: Limited-time cases
-   🔄 **Creator Analytics**: Detailed stats dashboard
-   🔄 **Referral System**: Invite friends, earn credits

### Phase 4

-   🔄 **Mobile App**: React Native companion app
-   🔄 **Skin Wear Conditions**: Include item float values
-   🔄 **StatTrak Support**: Special item variants
-   🔄 **Live Streams**: Watch others open cases
-   🔄 **API Access**: Let third parties integrate

---

## Deployment Checklist

### Backend

-   [ ] Set up PostgreSQL on AWS RDS / DigitalOcean
-   [ ] Configure Redis for sessions
-   [ ] Set up Steam API credentials
-   [ ] Configure S3 bucket for images
-   [ ] Deploy Express API to Railway / Render / AWS
-   [ ] Set up monitoring (Sentry, DataDog)

### Frontend

-   [ ] Deploy Next.js to Vercel
-   [ ] Configure environment variables
-   [ ] Set up CDN for static assets
-   [ ] Enable analytics (Plausible, Mixpanel)

### DevOps

-   [ ] Set up CI/CD pipeline
-   [ ] Configure database backups
-   [ ] Set up error tracking
-   [ ] Configure rate limiting
-   [ ] SSL certificates

---

## Monetization Options

1. **Platform Fees (10%)**: Already built-in
2. **Featured Cases**: Creators pay to promote their cases
3. **Premium Creator Accounts**: Advanced analytics, more cases
4. **Sponsored Cases**: Brands create promotional cases
5. **Credit Pack Bonuses**: Buy 1000 credits, get 1100

---

## Questions to Consider

1. **Item Redemption**: Will users be able to "cash out" items for real CS2 skins via Steam API?
2. **Minimum Case Price**: What's the floor to prevent spam?
3. **Creator Approval**: Should new cases be reviewed before going live?
4. **Duplicate Prevention**: How to handle multiple cases with identical items?
5. **Dispute Resolution**: What if there's a bug in opening logic?

---

This architecture gives you a solid foundation for a fair, transparent, and community-driven CS2 case platform. The key differentiator is **user-generated content** + **full transparency** = not gambling.

Ready to start building? 🚀
