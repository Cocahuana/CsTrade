# Case Opening System - Setup Guide

Quick guide to get the case opening system running.

## Prerequisites Completed ✅

-   PostgreSQL database (cstrades_dev)
-   Node.js backend with Express
-   Sequelize ORM configured
-   Collections and Items data loaded (65 collections, 969 items)
-   Price data fetching system (301+ prices)

## New Components Added 🆕

### Database Models Created

-   `CustomCase` - User-created cases
-   `CaseItem` - Items in cases with drop percentages
-   `CaseOpening` - Opening history with provably fair data
-   `Transaction` - Credit transaction ledger
-   `UserInventory` - Won items storage

### API Routes Created

-   `/api/cases` - Case CRUD operations
-   `/api/openings` - Case opening logic
-   `/api/creator` - Creator dashboard
-   `/api/users` (extended) - Inventory, transactions, credits

### Services Created

-   `caseOpeningService.js` - Provably fair opening logic, probability calculator

---

## 🚀 Setup Steps

### 1. Run Database Migration

The migration file is ready at: `api/src/migrations/20251110000000-add-case-opening-system.cjs`

Run migration:

```bash
cd api
npx sequelize-cli db:migrate
```

This will:

-   Add 5 new columns to `users` table
-   Create 5 new tables: `custom_cases`, `case_items`, `case_openings`, `transactions`, `user_inventory`
-   Add all indexes and constraints

**Rollback if needed:**

```bash
npx sequelize-cli db:migrate:undo
```

### 2. Verify Database Schema

After migration, verify tables exist:

```sql
\dt -- List all tables

-- Should see:
-- collections
-- collection_items
-- items
-- prices
-- users
-- trade_ups
-- float_values
-- custom_cases (NEW)
-- case_items (NEW)
-- case_openings (NEW)
-- transactions (NEW)
-- user_inventory (NEW)
```

### 3. Start the Server

```bash
cd api
npm run dev
```

Server will start on `http://localhost:5000`

### 4. Test the API

**Health Check:**

```bash
curl http://localhost:5000/health
```

**Get All Cases (will be empty initially):**

```bash
curl http://localhost:5000/api/cases
```

**Get User Balance:**

```bash
curl http://localhost:5000/api/users/<steamId>/balance
```

---

## 📝 Usage Examples

### Example 1: Add Credits to User

```bash
curl -X POST http://localhost:5000/api/users/76561198XXXXXXXX/credits/add \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "description": "Initial test credits"
  }'
```

### Example 2: Create a Case

First, get some item IDs from your database:

```sql
SELECT id, name FROM items LIMIT 10;
```

Then create a case:

```bash
curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId": "<user-uuid>",
    "title": "Nuke Collection Premium",
    "description": "Best skins from Nuke Collection",
    "priceCredits": 500,
    "items": [
      { "item_id": 123, "drop_chance": 45.50 },
      { "item_id": 456, "drop_chance": 30.00 },
      { "item_id": 789, "drop_chance": 24.50 }
    ]
  }'
```

**Note:** Drop chances must sum to exactly 100%

### Example 3: Calculate Suggested Probabilities

```bash
curl -X POST http://localhost:5000/api/cases/calculate-probabilities \
  -H "Content-Type: application/json" \
  -d '{
    "items": [123, 456, 789],
    "casePrice": 500
  }'
```

This will return suggested drop chances based on item prices (inverse value distribution).

### Example 4: Open a Case

```bash
curl -X POST http://localhost:5000/api/openings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-uuid>",
    "caseId": "<case-uuid>"
  }'
```

Returns:

-   Item won
-   Credits spent
-   New balance
-   Random seed (for verification)
-   Random value

### Example 5: Verify Opening Was Fair

```bash
curl http://localhost:5000/api/openings/verify/<opening-uuid>
```

Returns the drop table and shows which range the random number fell into.

---

## 🎮 Frontend Integration (Next Steps)

### Pages Needed

1. **Browse Cases** (`/cases`)

    - Grid of available cases
    - Filter by collection, creator, price
    - Sort by popularity, newest, price

2. **Case Details** (`/cases/:id`)

    - Case information
    - Drop table with percentages
    - Expected value & house edge
    - Recent openings

3. **Open Case** (`/cases/:id/open`)

    - Opening animation
    - Item reveal
    - Add to inventory

4. **Create Case** (`/cases/create`)

    - Select items from collections
    - Set probabilities
    - Preview expected value
    - Publish case

5. **Inventory** (`/inventory`)

    - Grid of won items
    - Current values
    - Unrealized profit/loss

6. **Creator Dashboard** (`/creator/dashboard`)
    - Total earnings
    - Cases created
    - Performance metrics
    - Recent earnings

### Required Components

-   `CaseCard` - Display case with stats
-   `CaseGrid` - Grid layout for cases
-   `DropTable` - Show items and percentages
-   `OpeningAnimation` - Spinning animation with items
-   `ItemCard` - Display item with price
-   `InventoryGrid` - User's won items
-   `ProbabilityCalculator` - Visual probability editor
-   `CreatorStats` - Dashboard charts

---

## 🔧 Configuration

### Environment Variables

Already configured in `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cstrades_dev
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Credit System

**Conversion:** 100 credits = $1 USD

Example:

-   $5 case = 500 credits
-   $0.50 item = 50 credits
-   $50 balance = 5000 credits

---

## 📊 Testing Workflow

### 1. Create Test User

```sql
INSERT INTO users (id, steam_id, steam_name, balance_credits)
VALUES (
  gen_random_uuid(),
  '76561198XXXXXXXX',
  'TestUser',
  10000
);
```

### 2. Add Credits via API

```bash
curl -X POST http://localhost:5000/api/users/76561198XXXXXXXX/credits/add \
  -H "Content-Type: application/json" \
  -d '{ "amount": 50000 }'
```

### 3. Create a Test Case

Use items from Nuke Collection (IDs 1-50 typically)

### 4. Open Case Multiple Times

Track stats:

-   Total spent
-   Total value won
-   Profit/loss percentage

### 5. Verify Random Distribution

After 100+ openings, verify drop rates match configured percentages

---

## 🐛 Troubleshooting

### Migration Fails

**Error:** Column already exists

```bash
# Check if tables exist
psql -U postgres -d cstrades_dev -c "\dt"

# If tables exist, migration was already run
# To re-run, first rollback:
npx sequelize-cli db:migrate:undo
```

### Foreign Key Errors

**Error:** User/Item/Collection not found

-   Ensure the referenced IDs exist in database
-   Use valid UUIDs for users
-   Use valid integer IDs for items

### Probability Sum Error

**Error:** Drop chances must sum to 100%

-   Check your math: probabilities must add to exactly 100
-   Use decimals: `45.50 + 30.00 + 24.50 = 100.00`
-   Allow tolerance: ±0.01% due to floating point

### Insufficient Credits

**Error:** User has insufficient credits

-   Check user balance: `GET /users/:steamId/balance`
-   Add credits: `POST /users/:steamId/credits/add`
-   Minimum balance = case price

---

## 📈 Next Steps

### Phase 1: Core Functionality ✅

-   [x] Database models
-   [x] API endpoints
-   [x] Provably fair system
-   [x] Credit system
-   [ ] Run migration
-   [ ] Test API endpoints

### Phase 2: Frontend Development

-   [ ] Next.js pages
-   [ ] Case browsing
-   [ ] Opening animation
-   [ ] Inventory management
-   [ ] Creator dashboard

### Phase 3: Advanced Features

-   [ ] Steam authentication
-   [ ] Payment integration (Stripe)
-   [ ] Item marketplace
-   [ ] Case statistics charts
-   [ ] User leaderboards

### Phase 4: Optimization

-   [ ] Caching (Redis)
-   [ ] Real-time updates (WebSockets)
-   [ ] Image optimization
-   [ ] Performance monitoring

---

## 📚 Documentation

-   **API Reference:** `docs/API.md`
-   **Architecture:** `docs/ARCHITECTURE.md`
-   **This Guide:** `docs/SETUP.md`

---

## 🎯 Quick Reference

**User has insufficient credits?**

```bash
POST /api/users/:steamId/credits/add
```

**Want to create a case?**

```bash
POST /api/cases
```

**Need suggested probabilities?**

```bash
POST /api/cases/calculate-probabilities
```

**Open a case?**

```bash
POST /api/openings
```

**Verify opening was fair?**

```bash
GET /openings/verify/:id
```

**Check creator earnings?**

```bash
GET /api/creator/:userId/stats
```

---

## ⚠️ Important Notes

1. **Probabilities must sum to 100%** - The API validates this strictly
2. **Credits are non-withdrawable** - This is NOT a gambling platform
3. **Random seeds are public** - Anyone can verify fairness
4. **Cases can't be edited after openings** - Prevents manipulation
5. **Fee distribution is automatic** - 10% platform, 15% creator, 75% pool

---

## 🚦 Ready to Go?

1. Run migration: `npx sequelize-cli db:migrate`
2. Start server: `npm run dev`
3. Add test credits to a user
4. Create your first case
5. Open it and verify the result!

For detailed API documentation, see `docs/API.md`
