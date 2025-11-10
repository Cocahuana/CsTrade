# Case Opening API Documentation

Complete API reference for the CS2 case opening platform.

## Base URL

```
http://localhost:5000/api
```

---

## 🎁 Cases API

### Get All Cases

Get paginated list of cases with filtering and sorting.

**Endpoint:** `GET /cases`

**Query Parameters:**

-   `page` (integer, default: 1) - Page number
-   `limit` (integer, default: 20) - Items per page
-   `featured` (boolean) - Filter featured cases
-   `collectionId` (string) - Filter by collection
-   `creatorId` (string) - Filter by creator
-   `sortBy` (string) - Sort order: `popular`, `newest`, `price-low`, `price-high`

**Response:**

```json
{
	"cases": [
		{
			"id": "uuid",
			"title": "Nuke Collection Premium",
			"description": "Best skins from Nuke Collection",
			"imageUrl": "https://...",
			"priceCredits": 500,
			"timesOpened": 1234,
			"totalRevenueCredits": 617000,
			"isActive": true,
			"isFeatured": false,
			"expectedValue": 450,
			"houseEdge": 10,
			"itemCount": 8,
			"creator": {
				"id": "uuid",
				"steamName": "Player123",
				"avatarUrl": "https://..."
			},
			"collection": {
				"id": "uuid",
				"name": "The Nuke Collection"
			}
		}
	],
	"pagination": {
		"total": 150,
		"page": 1,
		"limit": 20,
		"totalPages": 8
	}
}
```

---

### Get Single Case

Get detailed information about a specific case.

**Endpoint:** `GET /cases/:id`

**Response:**

```json
{
	"id": "uuid",
	"title": "Nuke Collection Premium",
	"description": "Best skins from Nuke Collection",
	"imageUrl": "https://...",
	"priceCredits": 500,
	"timesOpened": 1234,
	"expectedValue": 450,
	"houseEdge": 10,
	"creator": {
		"id": "uuid",
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
					"marketHashName": "AK-47 | Rat Rod (Field-Tested)",
					"price": 3.45,
					"lowestPrice": 3.2,
					"medianPrice": 3.5
				}
			}
		}
	]
}
```

---

### Create Case

Create a new case (creator function).

**Endpoint:** `POST /cases`

**Request Body:**

```json
{
	"creatorId": "uuid",
	"collectionId": "uuid",
	"title": "My Custom Case",
	"description": "A great case with rare items",
	"imageUrl": "https://...",
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

**Validation:**

-   Title: 5-255 characters
-   Price: 50-10,000 credits
-   Items: Minimum 2 items
-   Drop chances: Must sum to 100%
-   Each drop chance: 0.01-100

**Response:** Same as Get Single Case

---

### Update Case

Update an existing case (only if not yet opened).

**Endpoint:** `PUT /cases/:id`

**Request Body:** Same as Create Case (all fields optional)

**Response:** Updated case details

---

### Deactivate Case

Soft delete a case (mark as inactive).

**Endpoint:** `DELETE /cases/:id`

**Response:**

```json
{
	"message": "Case deactivated successfully"
}
```

---

### Calculate Probabilities

Get suggested drop probabilities based on item prices.

**Endpoint:** `POST /cases/calculate-probabilities`

**Request Body:**

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

**Algorithm:**

-   Higher value items = Lower drop chance
-   Inverse probability distribution
-   Normalized to sum to 100%
-   Reasonable house edge: 10-40%

---

### Get Case Openings

Get recent openings for a specific case.

**Endpoint:** `GET /cases/:id/openings`

**Query Parameters:**

-   `page` (integer, default: 1)
-   `limit` (integer, default: 50)

**Response:**

```json
{
  "openings": [
    {
      "id": "uuid",
      "creditsSpent": 500,
      "itemValueCredits": 450,
      "openedAt": "2024-01-10T12:34:56.789Z",
      "user": {
        "steamName": "Player123",
        "avatarUrl": "https://..."
      },
      "itemWon": {
        "name": "AK-47 | Rat Rod",
        "price": { "price": 4.50 }
      }
    }
  ],
  "pagination": { ... }
}
```

---

## 🎲 Openings API

### Open Case

Open a case and win an item.

**Endpoint:** `POST /openings`

**Request Body:**

```json
{
	"userId": "uuid",
	"caseId": "uuid"
}
```

**Response:**

```json
{
  "opening": {
    "id": "uuid",
    "creditsSpent": 500,
    "itemValueCredits": 450,
    "platformFeeCredits": 50,
    "creatorFeeCredits": 75,
    "poolContributionCredits": 375,
    "randomSeed": "a1b2c3d4...",
    "randomValue": 67.8912,
    "openedAt": "2024-01-10T12:34:56.789Z"
  },
  "newBalance": 9500,
  "itemWon": { ... },
  "itemValue": 450,
  "randomSeed": "a1b2c3d4...",
  "randomValue": 67.8912
}
```

**Fee Distribution:**

-   10% Platform fee
-   15% Creator fee
-   75% Pool contribution

**Provably Fair:**

-   `randomSeed`: Cryptographic seed (hex)
-   `randomValue`: Random number 0-100
-   Publicly verifiable

---

### Get Opening Details

Get details of a specific opening with verification data.

**Endpoint:** `GET /openings/:id`

**Response:** Opening details with user, case, and item information

---

### Get User Opening History

Get all openings for a specific user.

**Endpoint:** `GET /openings/user/:userId`

**Query Parameters:**

-   `page`, `limit`

**Response:**

```json
{
  "openings": [ ... ],
  "stats": {
    "totalOpenings": 50,
    "totalSpent": 25000,
    "totalValue": 23000,
    "profit": -2000,
    "profitPercentage": "-8.00"
  },
  "pagination": { ... }
}
```

---

### Verify Opening (Provably Fair)

Verify an opening was fair using the random seed.

**Endpoint:** `GET /openings/verify/:id`

**Response:**

```json
{
	"randomSeed": "a1b2c3d4...",
	"randomValue": 67.8912,
	"itemWon": "AK-47 | Rat Rod",
	"dropTable": [
		{
			"itemName": "AWP | Snake Camo",
			"start": 0,
			"end": 45.5,
			"dropChance": "45.50"
		},
		{
			"itemName": "AK-47 | Rat Rod",
			"start": 45.5,
			"end": 75.5,
			"dropChance": "30.00"
		},
		{
			"itemName": "M4A4 | Poly Mag",
			"start": 75.5,
			"end": 100,
			"dropChance": "24.50"
		}
	],
	"selectedRange": {
		"itemName": "AK-47 | Rat Rod",
		"start": 45.5,
		"end": 75.5
	},
	"verification": {
		"seedHex": "a1b2c3d4...",
		"randomNumber": 67.8912,
		"selectedItem": "AK-47 | Rat Rod",
		"isValid": true
	}
}
```

---

### Get Recent Openings

Get recent openings across all cases.

**Endpoint:** `GET /openings/recent/all`

**Query Parameters:**

-   `limit` (integer, default: 100)

---

## 👤 Users API

### Get User Profile

Get user profile with stats.

**Endpoint:** `GET /users/:steamId`

**Response:**

```json
{
	"success": true,
	"data": {
		"steamId": "76561198...",
		"steamName": "Player123",
		"avatarUrl": "https://...",
		"balanceCredits": 5000,
		"totalEarnedCredits": 15000,
		"totalSpentCredits": 10000,
		"totalCasesOpened": 50,
		"totalCasesCreated": 3,
		"totalTradeUps": 25,
		"profitableTradeUps": 12,
		"totalProfit": 150.5
	}
}
```

---

### Get User Inventory

Get items won from case openings.

**Endpoint:** `GET /users/:steamId/inventory`

**Query Parameters:**

-   `page`, `limit`
-   `sortBy`: `recent`, `value-high`, `value-low`

**Response:**

```json
{
	"success": true,
	"data": {
		"inventory": [
			{
				"id": "uuid",
				"acquiredValueCredits": 450,
				"currentValueCredits": 480,
				"isTradeable": true,
				"isListedForSale": false,
				"acquiredAt": "2024-01-10T12:34:56.789Z",
				"item": {
					"name": "AK-47 | Rat Rod",
					"price": { "price": 4.8 }
				},
				"caseOpening": {
					"case": {
						"title": "Nuke Premium",
						"imageUrl": "https://..."
					}
				}
			}
		],
		"stats": {
			"totalItems": 25,
			"totalValue": 12000,
			"totalAcquiredValue": 11500,
			"unrealizedProfit": 500,
			"unrealizedProfitPercentage": "4.35"
		}
	}
}
```

---

### Get Transactions

Get user's credit transaction history.

**Endpoint:** `GET /users/:steamId/transactions`

**Query Parameters:**

-   `page`, `limit`
-   `type`: Filter by transaction type

**Transaction Types:**

-   `deposit` - Credit deposits
-   `case_opening` - Case opening costs
-   `creator_earnings` - Creator earnings
-   `platform_fee` - Platform fees
-   `withdrawal` - Credit withdrawals
-   `refund` - Refunds

---

### Add Credits

Deposit credits to user balance.

**Endpoint:** `POST /users/:steamId/credits/add`

**Request Body:**

```json
{
	"amount": 1000,
	"description": "Credit purchase via Stripe"
}
```

**Response:**

```json
{
	"success": true,
	"data": {
		"balanceBefore": 5000,
		"balanceAfter": 6000,
		"amountAdded": 1000
	}
}
```

---

### Get Balance

Get user's current credit balance.

**Endpoint:** `GET /users/:steamId/balance`

**Response:**

```json
{
	"success": true,
	"data": {
		"balanceCredits": 5000,
		"balanceUSD": "50.00",
		"totalEarnedCredits": 15000,
		"totalSpentCredits": 10000,
		"netCredits": 5000
	}
}
```

---

## 🎨 Creator API

### Get Creator Stats

Get creator dashboard statistics.

**Endpoint:** `GET /creator/:userId/stats`

**Response:**

```json
{
  "user": { ... },
  "creatorStats": {
    "totalCasesCreated": 5,
    "activeCases": 3,
    "totalRevenue": 50000,
    "totalOpenings": 100,
    "totalEarnings": 7500,
    "averageEarningsPerOpening": "75.00"
  },
  "cases": [
    {
      "id": "uuid",
      "title": "My Case",
      "timesOpened": 50,
      "totalRevenueCredits": 25000,
      "earningsPerOpening": "75.00",
      "totalEarnings": "3750.00"
    }
  ],
  "recentEarnings": [ ... ]
}
```

---

### Get Creator Cases

Get all cases created by a user.

**Endpoint:** `GET /creator/:userId/cases`

**Query Parameters:**

-   `page`, `limit`
-   `status`: `all`, `active`, `inactive`

---

### Get Creator Earnings

Get detailed earnings history.

**Endpoint:** `GET /creator/:userId/earnings`

**Query Parameters:**

-   `page`, `limit`

**Response:**

```json
{
	"earnings": [
		{
			"amountCredits": 75,
			"balanceBefore": 5000,
			"balanceAfter": 5075,
			"description": "Earned from case opening: My Case",
			"createdAt": "2024-01-10T12:34:56.789Z",
			"caseOpening": {
				"user": { "steamName": "Player123" },
				"itemWon": { "name": "AK-47 | Rat Rod" }
			}
		}
	],
	"stats": {
		"totalEarnings": 7500,
		"transactionCount": 100
	}
}
```

---

### Creator Leaderboard

Get top creators by earnings.

**Endpoint:** `GET /creator/leaderboard/top`

**Query Parameters:**

-   `limit` (integer, default: 20)

**Response:**

```json
{
	"topCreators": [
		{
			"id": "uuid",
			"steamName": "TopCreator",
			"avatarUrl": "https://...",
			"totalCasesCreated": 10,
			"totalEarnedCredits": 50000
		}
	]
}
```

---

## 🎯 Collections API (Existing)

### Get All Collections

**Endpoint:** `GET /collections`

### Get Single Collection

**Endpoint:** `GET /collections/:id`

### Sync Collections

**Endpoint:** `POST /collections/sync`

---

## 💰 Prices API (Existing)

### Get Item Price

**Endpoint:** `GET /prices/:marketHashName`

### Fetch All Prices

**Endpoint:** `POST /prices/fetch-all`

### Update Price

**Endpoint:** `POST /prices/update`

---

## 🔐 Error Responses

All endpoints return errors in this format:

```json
{
	"success": false,
	"error": "Error message here"
}
```

**Common HTTP Status Codes:**

-   `200` - Success
-   `201` - Created
-   `400` - Bad Request (validation error)
-   `404` - Not Found
-   `403` - Forbidden
-   `500` - Internal Server Error

---

## 📊 Credit System

**Conversion Rate:** 100 credits = $1 USD

**Fee Distribution (per case opening):**

-   Platform: 10% of case price
-   Creator: 15% of case price
-   Pool: 75% of case price

**Example:** $5 case (500 credits)

-   Platform gets: 50 credits
-   Creator gets: 75 credits
-   Pool contribution: 375 credits

---

## 🎲 Provably Fair System

All case openings use cryptographically secure randomness:

1. Generate random bytes: `crypto.randomBytes(4)`
2. Convert to number: 0-100
3. Store seed (hex) and value
4. Public verification available at `/openings/verify/:id`

Users can verify any opening was fair by:

1. Getting the random seed
2. Checking the drop table ranges
3. Verifying the random value fell in correct range
4. Confirming correct item was awarded
