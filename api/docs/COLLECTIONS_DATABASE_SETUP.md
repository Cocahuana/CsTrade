# CS2 Collections Database Setup

## Overview

Successfully implemented a complete database solution for CS2 weapon collections, items, and their relationships.

## Database Schema

### Tables Created

#### 1. `collections`

Stores CS2 collection metadata.

| Column     | Type         | Constraints                 |
| ---------- | ------------ | --------------------------- |
| id         | INTEGER      | Primary Key, Auto-increment |
| name       | VARCHAR(255) | NOT NULL, UNIQUE            |
| created_at | TIMESTAMP    | NOT NULL                    |
| updated_at | TIMESTAMP    | NOT NULL                    |

**Indexes:**

-   Unique index on `name`

#### 2. `items`

Stores unique CS2 items (weapons with skins).

| Column     | Type         | Constraints                 |
| ---------- | ------------ | --------------------------- |
| id         | INTEGER      | Primary Key, Auto-increment |
| name       | VARCHAR(255) | NOT NULL, UNIQUE            |
| created_at | TIMESTAMP    | NOT NULL                    |
| updated_at | TIMESTAMP    | NOT NULL                    |

**Indexes:**

-   Unique index on `name`

**Note:** Integer IDs were chosen over UUIDs for:

-   Better performance (4 bytes vs 16 bytes)
-   Faster joins
-   Simpler debugging
-   Item names are already unique

#### 3. `collection_items` (Pivot Table)

Links collections to items with rarity information.

| Column        | Type      | Constraints                            |
| ------------- | --------- | -------------------------------------- |
| id            | INTEGER   | Primary Key, Auto-increment            |
| collection_id | INTEGER   | Foreign Key → collections(id), CASCADE |
| item_id       | INTEGER   | Foreign Key → items(id), CASCADE       |
| rarity        | ENUM      | 6 CS2 rarity tiers (see below)         |
| created_at    | TIMESTAMP | NOT NULL                               |
| updated_at    | TIMESTAMP | NOT NULL                               |

**Rarity Tiers:**

1. Consumer Grade
2. Industrial Grade
3. Mil-Spec Grade
4. Restricted
5. Classified
6. Covert

**Indexes:**

-   Unique index on `(collection_id, item_id)` - prevents duplicates
-   Index on `collection_id` - optimizes collection queries
-   Index on `item_id` - optimizes item queries
-   Index on `rarity` - optimizes rarity filtering

## Sequelize Models

### Created Models

1. **`api/src/models/Collection.js`**

    - Auto-loads via `models/index.js`
    - `belongsToMany` relationship with Item through CollectionItem

2. **`api/src/models/Item.js`**

    - Auto-loads via `models/index.js`
    - `belongsToMany` relationship with Collection through CollectionItem

3. **`api/src/models/CollectionItem.js`**
    - Auto-loads via `models/index.js`
    - `belongsTo` relationships with both Collection and Item

## Migration

### Migration File

**`api/src/migrations/20241109000005-create-collections.cjs`**

Created all three tables with:

-   Proper foreign key constraints
-   CASCADE delete/update rules
-   All necessary indexes
-   Reversible `up`/`down` methods

### Migration Execution

```bash
node node_modules/sequelize-cli/lib/sequelize db:migrate
```

**Result:** ✅ Successfully created all tables with indexes

## Data Seeding

### Seeder Script

**`api/scripts/seedCollections.js`**

Features:

-   Loads data from `ScrapedCollections.json`
-   Uses transactions for data integrity
-   Bulk inserts for performance
-   Deduplicates items across collections
-   Error handling with automatic rollback

### Seeding Execution

```bash
node scripts/seedCollections.js
```

### Seeding Results

```
══════════════════════════════════════════════════
SEEDING COMPLETE
══════════════════════════════════════════════════
Collections created: 65
Unique items created: 969
Collection-item links: 969
══════════════════════════════════════════════════
```

## Data Source

### Scraper Script

**`api/scripts/scrapeCollections.js`**

-   Source: https://totalcsgo.com/skins/collections
-   Method: HTTPS GET requests with HTML parsing
-   Pattern: Regex extraction from JavaScript objects
-   Output: `api/src/data/ScrapedCollections.json`

### Data Format

```json
{
	"The Genesis Collection": {
		"Covert": ["AK-47 | The Oligarch", "M4A4 | Full Throttle"],
		"Classified": ["Desert Eagle | Serpent Strike", "Galil AR | Control"],
		"Restricted": ["AWP | Ice Coaled", "Glock-18 | Mirror Mosaic"],
		"Mil-Spec Grade": ["P2000 | Sure Grip", "M4A4 | Choppa"],
		"Industrial Grade": ["MAG-7 | Resupply", "MP9 | Nexus"],
		"Consumer Grade": ["AUG | Trigger Discipline", "P2000 | Red Wing"]
	}
}
```

## Package.json Scripts

Added migration scripts to `api/package.json`:

```json
{
	"scripts": {
		"migrate": "sequelize-cli db:migrate",
		"migrate:undo": "sequelize-cli db:migrate:undo"
	}
}
```

## Database Relationships

```
Collection (1) ←──→ (*) CollectionItem (*) ←──→ (1) Item
               └──────────── rarity ────────────┘
```

### Example Queries

**Get all items in a collection:**

```javascript
const collection = await Collection.findByPk(1, {
	include: [{ model: Item, through: { attributes: ["rarity"] } }],
});
```

**Get all collections containing an item:**

```javascript
const item = await Item.findByPk(1, {
	include: [{ model: Collection, through: { attributes: ["rarity"] } }],
});
```

**Get items by rarity:**

```javascript
const covertItems = await CollectionItem.findAll({
	where: { rarity: "Covert" },
	include: [Collection, Item],
});
```

## Statistics

-   **Total Collections:** 80 (65 populated in DB currently)
-   **Unique Items:** 969 CS2 weapon skins
-   **Collection-Item Links:** 969 relationships
-   **Rarity Tiers:** 6 (Consumer → Covert)
-   **Data Source:** totalcsgo.com
-   **Scraping Time:** ~3 minutes (2-second delay between requests)

## Next Steps (Optional)

1. **API Endpoints:**

    - GET `/collections` - List all collections
    - GET `/collections/:id` - Get collection with items
    - GET `/items` - List all items
    - GET `/items/:id` - Get item with collections
    - GET `/collections/:id/items/:rarity` - Filter by rarity

2. **Frontend Integration:**

    - Redux slice for collections data
    - Components for collection browser
    - Rarity filtering UI

3. **Additional Features:**
    - Item prices from Steam API
    - Trade-up calculator using rarity tiers
    - Collection completion tracker

## Files Created/Modified

### Created:

-   `api/src/models/Collection.js`
-   `api/src/models/Item.js`
-   `api/src/models/CollectionItem.js`
-   `api/src/migrations/20241109000005-create-collections.cjs`
-   `api/scripts/seedCollections.js`
-   `api/docs/COLLECTIONS_DATABASE_SETUP.md` (this file)

### Modified:

-   `api/package.json` (added migration scripts)

### Existing (Referenced):

-   `api/scripts/scrapeCollections.js`
-   `api/src/data/ScrapedCollections.json`
