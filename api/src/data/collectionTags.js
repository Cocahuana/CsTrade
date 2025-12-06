/**
 * Mapping of Collection Names to Steam Market Tags
 *
 * This is a best-effort mapping. Steam tags often follow patterns but have exceptions.
 * The pattern is usually "tag_set_" + collection name (lowercase, spaces replaced by underscores).
 */
export const COLLECTION_TAGS = {
	// Recent Collections (2024-2025)
	"The Genesis Collection": "tag_set_op14_genesis",
	"The Fever Collection": "tag_set_op14_fever",
	"The Safari Mesh Collection": "tag_set_op14_safarimesh",
	"The Kilowatt Collection": "tag_set_op13_kilowatt",
	"The Gallery Collection": "tag_set_op13_gallery",
	"The Gods and Monsters Collection": "tag_set_gods_and_monsters",

	// 2022-2023 Collections
	"The Revolution Collection": "tag_set_op12_revolution",
	"The Anubis Collection": "tag_set_op12_anubis",
	"The Recoil Collection": "tag_set_op11_recoil",
	"The Dreams & Nightmares Collection": "tag_set_op11_dn",
	"The Riptide Collection": "tag_set_op10_riptide",

	// 2021 Collections
	"The 2021 Dust 2 Collection": "tag_set_op10_t",
	"The 2021 Mirage Collection": "tag_set_op10_ct",
	"The 2021 Train Collection": "tag_set_op10_ancient",
	"The 2021 Vertigo Collection": "tag_set_op10_vertigo",

	// 2020-2021 Collections
	"The Havoc Collection": "tag_set_op9_havoc",
	"The Control Collection": "tag_set_op9_control",
	"The Ancient Collection": "tag_set_op9_ancient",
	"The Snakebite Collection": "tag_set_op8_css",
	"The Operation Broken Fang Collection": "tag_set_op8_cs2",

	// 2018-2020 Collections
	"The Prisma Collection": "tag_set_prisma",
	"The Prisma 2 Collection": "tag_set_prisma_2",
	"The Clutch Collection": "tag_set_clutch",
	"The Horizon Collection": "tag_set_horizon",
	"The Danger Zone Collection": "tag_set_dangerzone",
	"The CS20 Collection": "tag_set_cs20",
	"The Shattered Web Collection": "tag_set_op7_shatteredweb",
	"The Fracture Collection": "tag_set_fracture",
	"The St. Marc Collection": "tag_set_stmarc",
	"The Canals Collection": "tag_set_canals",
	"The Norse Collection": "tag_set_norse",
	"The Chop Shop Collection": "tag_set_chopshop",

	// Classic Map Collections
	"The 2018 Inferno Collection": "tag_set_inferno_2",
	"The 2018 Nuke Collection": "tag_set_nuke_2",
	"The Dust 2 Collection": "tag_set_dust_2",
	"The Mirage Collection": "tag_set_mirage",
	"The Inferno Collection": "tag_set_inferno",
	"The Nuke Collection": "tag_set_nuke",
	"The Cobblestone Collection": "tag_set_cobblestone",
	"The Overpass Collection": "tag_set_overpass",
	"The Cache Collection": "tag_set_cache",
	"The Train Collection": "tag_set_train",
	"The Vertigo Collection": "tag_set_vertigo",
	"The Italy Collection": "tag_set_italy",
	"The Lake Collection": "tag_set_lake",
	"The Aztec Collection": "tag_set_aztec",
	"The Assault Collection": "tag_set_assault",
	"The Militia Collection": "tag_set_militia",
	"The Office Collection": "tag_set_office",
	"The Bank Collection": "tag_set_bank",
	"The Safehouse Collection": "tag_set_safehouse",
	"The Baggage Collection": "tag_set_baggage",

	// Older Notable Collections
	"The Alpha Collection": "tag_set_bravo_i",
	"The Bravo Collection": "tag_set_bravo_ii",
	"The Arms Deal Collection": "tag_set_esports",
	"The eSports 2013 Collection": "tag_set_esports_ii",
	"The eSports 2013 Winter Collection": "tag_set_esports_iii",
	"The eSports 2014 Summer Collection": "tag_set_esports_iv",
	"The Winter Offensive Collection": "tag_set_community_1",
	"The Phoenix Collection": "tag_set_community_2",
	"The Huntsman Collection": "tag_set_community_3",
	"The Breakout Collection": "tag_set_community_4",
	"The Vanguard Collection": "tag_set_community_5",
	"The Chroma Collection": "tag_set_community_6",
	"The Chroma 2 Collection": "tag_set_community_7",
	"The Chroma 3 Collection": "tag_set_community_8",
	"The Falchion Collection": "tag_set_community_9",
	"The Shadow Collection": "tag_set_community_10",
	"The Revolver Collection": "tag_set_community_11",
	"The Wildfire Collection": "tag_set_community_12",
	"The Gamma Collection": "tag_set_gamma",
	"The Gamma 2 Collection": "tag_set_gamma_2",
	"The Glove Collection": "tag_set_glove",
	"The Spectrum Collection": "tag_set_spectrum",
	"The Spectrum 2 Collection": "tag_set_spectrum_2",
	"The Hydra Collection": "tag_set_op8_hydra",
};

/**
 * Try to guess the tag for a collection name
 * @param {string} collectionName
 * @returns {string}
 */
export function getCollectionTag(collectionName) {
	if (COLLECTION_TAGS[collectionName]) {
		return COLLECTION_TAGS[collectionName];
	}

	// Default heuristic: "The X Collection" -> "tag_set_x"
	// Remove "The " prefix and " Collection" suffix
	let cleanName = collectionName
		.replace(/^The /, "")
		.replace(/ Collection$/, "")
		.toLowerCase();

	// Replace spaces and hyphens with underscores
	cleanName = cleanName.replace(/[\s-]/g, "_");

	// Handle years if present (e.g. "2018 Inferno" -> "inferno_2" is tricky,
	// but let's just try the direct mapping first)

	return `tag_set_${cleanName}`;
}
