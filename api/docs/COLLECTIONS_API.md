# Collections API Endpoints

## Base URL

`http://localhost:5000/api/collections`

---

## 1. GET `/api/collections`

Get all CS2 collections from database with pagination.

### Query Parameters

| Parameter      | Type    | Default | Description               |
| -------------- | ------- | ------- | ------------------------- |
| `includeItems` | boolean | `false` | Include items in response |
| `page`         | number  | `1`     | Page number               |
| `limit`        | number  | `50`    | Items per page (max: 100) |

### Example Requests

**Get collections without items:**

```bash
curl "http://localhost:5000/api/collections?limit=10"
```

**Get collections with items:**

```bash
curl "http://localhost:5000/api/collections?limit=5&includeItems=true"
```

### Response

```json
{
	"success": true,
	"data": {
		"collections": [
			{
				"id": 1,
				"name": "The Genesis Collection",
				"createdAt": "2025-11-09T19:35:44.076Z",
				"updatedAt": "2025-11-09T19:35:44.076Z",
				"items": [
					/* only if includeItems=true */
					{
						"id": 1,
						"name": "AK-47 | The Oligarch",
						"CollectionItem": {
							"rarity": "Covert"
						}
					}
				]
			}
		],
		"pagination": {
			"page": 1,
			"limit": 50,
			"total": 65,
			"totalPages": 2,
			"hasMore": true
		}
	}
}
```

---

## 2. GET `/api/collections/:id`

Get a specific collection by ID with all its items grouped by rarity.

### URL Parameters

| Parameter | Type   | Description   |
| --------- | ------ | ------------- |
| `id`      | number | Collection ID |

### Example Request

```bash
curl "http://localhost:5000/api/collections/1"
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "The Genesis Collection",
    "itemCount": 17,
    "itemsByRarity": {
      "Covert": [
        {
          "id": 16,
          "name": "AK-47 | The Oligarch"
        },
        {
          "id": 17,
          "name": "M4A4 | Full Throttle"
        }
      ],
      "Classified": [
        {
          "id": 13,
          "name": "AWP | Ice Coaled"
        }
      ],
      "Restricted": [...],
      "Mil-Spec Grade": [...],
      "Industrial Grade": [...],
      "Consumer Grade": [...]
    },
    "createdAt": "2025-11-09T19:35:44.076Z",
    "updatedAt": "2025-11-09T19:35:44.076Z"
  }
}
```

### Error Response (404)

```json
{
	"success": false,
	"error": {
		"message": "Collection not found",
		"code": "COLLECTION_NOT_FOUND"
	}
}
```

---

## 3. POST `/api/collections/sync`

Scrape and synchronize CS2 collections from totalcsgo.com.

**⚠️ Note:** This is a long-running operation (~3 minutes). It will:

1. Scrape all 65+ collections from totalcsgo.com
2. Update database with new collections/items
3. Refresh existing collection data

### Example Request

```bash
curl -X POST "http://localhost:5000/api/collections/sync"
```

### Response (Success)

```json
{
	"success": true,
	"data": {
		"scraping": {
			"collectionsScraped": 65,
			"totalItems": 969,
			"duration": "180.45s"
		},
		"database": {
			"collectionsAdded": 5,
			"collectionsUpdated": 60,
			"itemsAdded": 42,
			"linksAdded": 969
		},
		"timestamp": "2025-11-09T19:50:00.000Z"
	}
}
```

### Response (Error)

```json
{
	"success": false,
	"error": {
		"message": "Failed to scrape collections",
		"details": "Network timeout",
		"code": "SCRAPING_FAILED"
	}
}
```

---

## Rarity Tiers

Collections organize items into 6 rarity tiers:

1. **Consumer Grade** (Most common)
2. **Industrial Grade**
3. **Mil-Spec Grade**
4. **Restricted**
5. **Classified**
6. **Covert** (Most rare)

---

## Data Models

### Collection

```typescript
{
	id: number;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}
```

### Item

```typescript
{
	id: number;
	name: string; // Format: "Weapon | Skin Name"
	createdAt: Date;
	updatedAt: Date;
}
```

### CollectionItem (Pivot/Junction)

```typescript
{
	collection_id: number;
	item_id: number;
	rarity: "Consumer Grade" |
		"Industrial Grade" |
		"Mil-Spec Grade" |
		"Restricted" |
		"Classified" |
		"Covert";
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
	"success": false,
	"error": "Error message",
	"stack": "Stack trace (only in development)"
}
```

Common HTTP Status Codes:

-   `200` - Success
-   `404` - Resource not found
-   `500` - Internal server error
