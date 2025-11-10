# Postman Guide: Adding Cases, Users, and Credits

Complete guide to test your CS2 case opening API using Postman.

## 🚀 Setup

**Base URL:** `http://localhost:5000/api`

Make sure your backend server is running:

```bash
cd api
npm start
```

---

## 👤 1. Creating Users & Adding Credits

### Step 1: Add Credits to a User (Auto-creates User)

**Endpoint:** `POST /users/:steamId/credits/add`

**URL:** `http://localhost:5000/api/users/76561198123456789/credits/add`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
	"amount": 10000,
	"description": "Initial deposit for testing"
}
```

**Response:**

```json
{
	"success": true,
	"data": {
		"userCreated": true,
		"balanceBefore": 0,
		"balanceAfter": 10000,
		"amountAdded": 10000
	}
}
```

> **✅ New Feature:** The user is **automatically created** if it doesn't exist! The `userCreated` field indicates if a new user was created (`true`) or if credits were added to an existing user (`false`).

> **Note:** Replace `76561198123456789` with any Steam ID you want to use. The user will initially have their Steam ID as their username.

### Step 2: Verify User Balance

**Endpoint:** `GET /users/:steamId/balance`

**URL:** `http://localhost:5000/api/users/76561198123456789/balance`

**Response:**

```json
{
	"success": true,
	"data": {
		"balanceCredits": 10000,
		"balanceUSD": "100.00",
		"totalEarnedCredits": 10000,
		"totalSpentCredits": 0,
		"netCredits": 10000
	}
}
```

### Step 3: Get User Profile

**Endpoint:** `GET /users/:steamId`

**URL:** `http://localhost:5000/api/users/76561198123456789`

**Response:**

```json
{
	"success": true,
	"data": {
		"steamId": "76561198123456789",
		"steamName": "Player123",
		"avatarUrl": "https://...",
		"balanceCredits": 10000,
		"totalEarnedCredits": 10000,
		"totalSpentCredits": 0,
		"totalCasesOpened": 0,
		"totalCasesCreated": 0,
		"totalTradeUps": 0,
		"profitableTradeUps": 0,
		"totalProfit": 0
	}
}
```

### Step 4 (Optional): Update User Profile

If you want to set a custom username and avatar after auto-creation:

**Endpoint:** `PUT /users/:steamId`

**URL:** `http://localhost:5000/api/users/76561198123456789`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
	"steamName": "MyCustomName",
	"avatarUrl": "https://avatars.steamstatic.com/abc123.jpg"
}
```

**Response:**

```json
{
	"success": true,
	"data": {
		"steamId": "76561198123456789",
		"steamName": "MyCustomName",
		"avatarUrl": "https://avatars.steamstatic.com/abc123.jpg",
		"lastActive": "2024-01-10T12:34:56.789Z"
	}
}
```

---

## 🎁 2. Creating Cases

### Step 1: Get Available Items

First, you need item IDs from your database. Get collections to find items:

**Endpoint:** `GET /collections`

**URL:** `http://localhost:5000/api/collections`

Or get a specific collection:

**Endpoint:** `GET /collections/:id`

**URL:** `http://localhost:5000/api/collections/1`

**Response will include items:**

```json
{
	"id": 1,
	"name": "The Nuke Collection",
	"items": [
		{
			"id": 123,
			"name": "AK-47 | Rat Rod",
			"rarity": "Mil-Spec Grade",
			"price": {
				"price": 4.5
			}
		}
		// ... more items
	]
}
```

### Step 2: (Optional) Calculate Probabilities

Get suggested drop chances based on item values:

**Endpoint:** `POST /cases/calculate-probabilities`

**URL:** `http://localhost:5000/api/cases/calculate-probabilities`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
	"items": [123, 456, 789],
	"casePrice": 500
}
```

**Response:**

```json
{
	"probabilities": [
		{ "item_id": 123, "drop_chance": 45.5 },
		{ "item_id": 456, "drop_chance": 30.0 },
		{ "item_id": 789, "drop_chance": 24.5 }
	],
	"expectedValue": 450,
	"houseEdge": 10,
	"isReasonable": true
}
```

### Step 3: Create Case

**Endpoint:** `POST /cases`

**URL:** `http://localhost:5000/api/cases`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
	"creatorId": "76561198123456789",
	"collectionId": "1",
	"title": "Nuke Collection Premium",
	"description": "Best skins from the Nuke Collection with great drop rates!",
	"imageUrl": "https://example.com/case-image.png",
	"priceCredits": 500,
	"items": [
		{
			"item_id": 123,
			"drop_chance": 45.5
		},
		{
			"item_id": 456,
			"drop_chance": 30.0
		},
		{
			"item_id": 789,
			"drop_chance": 24.5
		}
	]
}
```

**Requirements:**

-   `title`: 5-255 characters
-   `priceCredits`: 50-10,000 (50 credits = $0.50, 10,000 = $100.00)
-   `items`: Minimum 2 items
-   `drop_chance`: Must sum to exactly 100%
-   Each `drop_chance`: 0.01-100

**Response:**

```json
{
	"id": "uuid-here",
	"title": "Nuke Collection Premium",
	"description": "Best skins from the Nuke Collection with great drop rates!",
	"imageUrl": "https://example.com/case-image.png",
	"priceCredits": 500,
	"timesOpened": 0,
	"expectedValue": 450,
	"houseEdge": 10,
	"creator": {
		"id": "76561198123456789",
		"steamName": "Player123",
		"avatarUrl": "https://..."
	},
	"caseItems": [
		{
			"id": "uuid",
			"dropChancePercentage": "45.50",
			"item": {
				"id": 123,
				"name": "AK-47 | Rat Rod",
				"price": {
					"price": 4.5
				}
			}
		}
		// ... more items
	]
}
```

### Step 4: Verify Case Created

**Endpoint:** `GET /cases/:id`

**URL:** `http://localhost:5000/api/cases/{case-id-from-response}`

---

## 🎲 3. Opening Cases

### Step 1: Open a Case

**Endpoint:** `POST /openings`

**URL:** `http://localhost:5000/api/openings`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
	"userId": "76561198123456789",
	"caseId": "uuid-of-your-case"
}
```

**Response:**

```json
{
	"opening": {
		"id": "opening-uuid",
		"creditsSpent": 500,
		"itemValueCredits": 450,
		"platformFeeCredits": 50,
		"creatorFeeCredits": 75,
		"poolContributionCredits": 375,
		"randomSeed": "a1b2c3d4e5f6...",
		"randomValue": 67.8912,
		"openedAt": "2024-01-10T12:34:56.789Z"
	},
	"newBalance": 9500,
	"itemWon": {
		"id": 456,
		"name": "M4A4 | Desert-Strike",
		"price": {
			"price": 4.5
		}
	},
	"itemValue": 450,
	"randomSeed": "a1b2c3d4e5f6...",
	"randomValue": 67.8912
}
```

**Fee Distribution (for $5 case):**

-   Platform: 50 credits (10%)
-   Creator: 75 credits (15%)
-   Pool: 375 credits (75%)

### Step 2: Verify Opening (Provably Fair)

**Endpoint:** `GET /openings/verify/:id`

**URL:** `http://localhost:5000/api/openings/verify/{opening-id}`

**Response:**

```json
{
	"randomSeed": "a1b2c3d4e5f6...",
	"randomValue": 67.8912,
	"itemWon": "M4A4 | Desert-Strike",
	"dropTable": [
		{
			"itemName": "AK-47 | Rat Rod",
			"start": 0,
			"end": 45.5,
			"dropChance": "45.50"
		},
		{
			"itemName": "M4A4 | Desert-Strike",
			"start": 45.5,
			"end": 75.5,
			"dropChance": "30.00"
		},
		{
			"itemName": "AWP | Snake Camo",
			"start": 75.5,
			"end": 100,
			"dropChance": "24.50"
		}
	],
	"selectedRange": {
		"itemName": "M4A4 | Desert-Strike",
		"start": 45.5,
		"end": 75.5
	},
	"verification": {
		"seedHex": "a1b2c3d4e5f6...",
		"randomNumber": 67.8912,
		"selectedItem": "M4A4 | Desert-Strike",
		"isValid": true
	}
}
```

### Step 3: Check User Inventory

**Endpoint:** `GET /users/:steamId/inventory`

**URL:** `http://localhost:5000/api/users/76561198123456789/inventory`

**Response:**

```json
{
	"success": true,
	"data": {
		"inventory": [
			{
				"id": "inventory-item-uuid",
				"acquiredValueCredits": 450,
				"currentValueCredits": 480,
				"isTradeable": true,
				"isListedForSale": false,
				"acquiredAt": "2024-01-10T12:34:56.789Z",
				"item": {
					"name": "M4A4 | Desert-Strike",
					"price": { "price": 4.8 }
				},
				"caseOpening": {
					"case": {
						"title": "Nuke Collection Premium",
						"imageUrl": "https://..."
					}
				}
			}
		],
		"stats": {
			"totalItems": 1,
			"totalValue": 480,
			"totalAcquiredValue": 450,
			"unrealizedProfit": 30,
			"unrealizedProfitPercentage": "6.67"
		}
	}
}
```

---

## 📊 4. Checking Stats & History

### User Opening History

**Endpoint:** `GET /openings/user/:userId`

**URL:** `http://localhost:5000/api/openings/user/76561198123456789`

**Response includes:**

-   All openings
-   Total stats (spent, value, profit)
-   Pagination

### Creator Stats

**Endpoint:** `GET /creator/:userId/stats`

**URL:** `http://localhost:5000/api/creator/76561198123456789/stats`

**Response includes:**

-   Total cases created
-   Revenue & earnings
-   Per-case statistics

### Recent Openings (All Cases)

**Endpoint:** `GET /openings/recent/all`

**URL:** `http://localhost:5000/api/openings/recent/all?limit=10`

---

## 🔥 Quick Start Recipe

Here's a complete workflow to test everything:

### 1. Create Test User with Credits (Auto-creates User)

```
POST /users/76561198123456789/credits/add
Body: { "amount": 10000, "description": "Testing" }
```

✅ **User is created automatically!** No need to create user separately.

### 2. (Optional) Update User Profile

```
PUT /users/76561198123456789
Body: { "steamName": "TestPlayer", "avatarUrl": "https://..." }
```

### 3. Get Items from Collections

```
GET /collections/1
(Copy some item IDs from response)
```

### 4. Create a Test Case

```
POST /cases
Body: {
  "creatorId": "76561198123456789",
  "collectionId": "1",
  "title": "Test Case",
  "description": "My first test case",
  "imageUrl": "https://via.placeholder.com/300",
  "priceCredits": 500,
  "items": [
    { "item_id": 123, "drop_chance": 50.0 },
    { "item_id": 456, "drop_chance": 50.0 }
  ]
}
(Copy case ID from response)
```

### 5. Open the Case

```
POST /openings
Body: {
  "userId": "76561198123456789",
  "caseId": "your-case-id-here"
}
```

### 6. Check Results

```
GET /users/76561198123456789/inventory
GET /users/76561198123456789/balance
GET /creator/76561198123456789/stats
```

---

## 💡 Tips

**Credit Amounts:**

-   100 credits = $1.00
-   500 credits = $5.00
-   1000 credits = $10.00
-   10000 credits = $100.00

**Drop Chances Must Sum to 100%:**

-   2 items: 50% + 50% = 100% ✅
-   3 items: 40% + 35% + 25% = 100% ✅
-   4 items: 30% + 30% + 25% + 15% = 100% ✅

**Common Errors:**

-   `User not found` → **FIXED!** Users are now created automatically when adding credits
-   Drop chances don't sum to 100% → Adjust percentages to exactly 100%
-   Not enough credits → Add more credits to user
-   Item IDs don't exist → Check collections endpoint first
-   Case price too low/high → Use 50-10,000 credits

**User Creation:**

-   ✅ **Auto-created** when adding credits (new feature!)
-   Initially uses Steam ID as username
-   Update profile later with custom name/avatar using `PUT /users/:steamId`
-   `userCreated: true` in response indicates new user was created

---

## 🛠️ Postman Collection Structure

Recommended folder organization:

```
CS2 Case Opening API
├── 👤 Users
│   ├── Add Credits
│   ├── Get Balance
│   ├── Get Profile
│   └── Get Inventory
├── 🎁 Cases
│   ├── Create Case
│   ├── Get All Cases
│   ├── Get Case Details
│   └── Calculate Probabilities
├── 🎲 Openings
│   ├── Open Case
│   ├── Verify Opening
│   ├── User History
│   └── Recent Openings
├── 🎨 Creator
│   ├── Get Stats
│   ├── Get Earnings
│   └── Get Cases
└── 📦 Collections
    ├── Get All
    └── Get Single
```

---

## 🔐 Environment Variables (Optional)

Create a Postman environment with:

```
BASE_URL = http://localhost:5000/api
TEST_USER_ID = 76561198123456789
TEST_CASE_ID = (save after creating case)
```

Then use `{{BASE_URL}}`, `{{TEST_USER_ID}}`, etc. in requests.
