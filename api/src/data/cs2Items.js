/**
 * CS2 Items Database
 * This file contains information about CS2 skins, cases, and other items
 *
 * Note: This is a simplified version. In production, you'd want to:
 * 1. Fetch this from Steam's item schema API
 * 2. Store in a database (MongoDB, PostgreSQL, etc.)
 * 3. Update periodically to get new items
 */

export const CS2_COLLECTIONS = [
	"The Prisma Collection",
	"The Clutch Collection",
	"The Horizon Collection",
	"The Danger Zone Collection",
	"The Prisma 2 Collection",
	"The Shattered Web Collection",
	"The CS20 Collection",
	"The Fracture Collection",
	"The Broken Fang Collection",
	"The Ancient Collection",
	"The Snakebite Collection",
	"The Operation Riptide Collection",
	"The Dreams & Nightmares Collection",
	"The Recoil Collection",
	"The Revolution Collection",
	"The Kilowatt Collection",
];

export const CS2_RARITIES = {
	CONSUMER: {
		name: "Consumer Grade",
		color: "#b0c3d9",
		tier: 1,
	},
	INDUSTRIAL: {
		name: "Industrial Grade",
		color: "#5e98d9",
		tier: 2,
	},
	MIL_SPEC: {
		name: "Mil-Spec Grade",
		color: "#4b69ff",
		tier: 3,
	},
	RESTRICTED: {
		name: "Restricted",
		color: "#8847ff",
		tier: 4,
	},
	CLASSIFIED: {
		name: "Classified",
		color: "#d32ce6",
		tier: 5,
	},
	COVERT: {
		name: "Covert",
		color: "#eb4b4b",
		tier: 6,
	},
	CONTRABAND: {
		name: "Contraband",
		color: "#e4ae39",
		tier: 7,
	},
};

export const CS2_EXTERIORS = [
	"Factory New",
	"Minimal Wear",
	"Field-Tested",
	"Well-Worn",
	"Battle-Scarred",
];

export const CS2_WEAPON_TYPES = [
	// Rifles
	"AK-47",
	"M4A4",
	"M4A1-S",
	"AWP",
	"AUG",
	"FAMAS",
	"Galil AR",
	"SG 553",
	"SSG 08",
	"SCAR-20",
	"G3SG1",

	// SMGs
	"MP9",
	"MAC-10",
	"MP7",
	"MP5-SD",
	"UMP-45",
	"P90",
	"PP-Bizon",

	// Heavy
	"Nova",
	"XM1014",
	"MAG-7",
	"Sawed-Off",
	"M249",
	"Negev",

	// Pistols
	"Desert Eagle",
	"Glock-18",
	"USP-S",
	"P2000",
	"P250",
	"Five-SeveN",
	"Tec-9",
	"CZ75-Auto",
	"Dual Berettas",
	"R8 Revolver",

	// Knives
	"Bayonet",
	"Butterfly Knife",
	"Flip Knife",
	"Gut Knife",
	"Karambit",
	"M9 Bayonet",
	"Huntsman Knife",
	"Falchion Knife",
	"Bowie Knife",
	"Shadow Daggers",
	"Ursus Knife",
	"Navaja Knife",
	"Stiletto Knife",
	"Talon Knife",
	"Classic Knife",
	"Paracord Knife",
	"Survival Knife",
	"Nomad Knife",
	"Skeleton Knife",

	// Gloves
	"Gloves",
];

/**
 * Get all CS2 items metadata
 * This would ideally fetch from Steam's GetAssetClassInfo or a database
 */
export function getAllCS2Items() {
	return {
		collections: CS2_COLLECTIONS,
		rarities: CS2_RARITIES,
		exteriors: CS2_EXTERIORS,
		weaponTypes: CS2_WEAPON_TYPES,
		metadata: {
			totalCollections: CS2_COLLECTIONS.length,
			totalWeaponTypes: CS2_WEAPON_TYPES.length,
			supportedExteriors: CS2_EXTERIORS.length,
			lastUpdated: new Date().toISOString(),
		},
	};
}

/**
 * Get items by collection
 * In production, this would query a database
 */
export function getItemsByCollection(collectionName) {
	// This is a placeholder - in production you'd fetch from database
	// or Steam's API
	return {
		collection: collectionName,
		items: [], // Would be populated from database
		message: "Item details require database integration",
	};
}

/**
 * Search items by name
 * In production, this would use full-text search on a database
 */
export function searchItems(query) {
	// Placeholder for search functionality
	return {
		query,
		results: [],
		message: "Search requires database integration",
	};
}
