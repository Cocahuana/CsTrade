-- CreateTable: Collections
CREATE TABLE "Collections" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Items
CREATE TABLE "Items" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: CollectionItems (Pivot Table)
CREATE TABLE "CollectionItems" (
    "id" SERIAL PRIMARY KEY,
    "collection_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "rarity" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT "CollectionItems_collection_id_fkey" 
        FOREIGN KEY ("collection_id") REFERENCES "Collections"("id") ON DELETE CASCADE,
    CONSTRAINT "CollectionItems_item_id_fkey" 
        FOREIGN KEY ("item_id") REFERENCES "Items"("id") ON DELETE CASCADE,
    
    -- Ensure no duplicate item-collection pairs
    CONSTRAINT "CollectionItems_collection_id_item_id_key" 
        UNIQUE ("collection_id", "item_id")
);

-- Create Indexes for better query performance
CREATE INDEX "CollectionItems_collection_id_idx" ON "CollectionItems"("collection_id");
CREATE INDEX "CollectionItems_item_id_idx" ON "CollectionItems"("item_id");
CREATE INDEX "CollectionItems_rarity_idx" ON "CollectionItems"("rarity");
CREATE INDEX "Items_name_idx" ON "Items"("name");
CREATE INDEX "Collections_name_idx" ON "Collections"("name");
