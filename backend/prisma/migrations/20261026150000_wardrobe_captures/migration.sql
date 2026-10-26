-- Members can photograph their own clothes and keep them in the wardrobe.
--
-- A captured piece is stored as a Product with an owner, rather than as a separate kind of thing.
-- That way it works everywhere a catalogue piece works — looks, the canvas, the wardrobe — with no
-- parallel code path. The trade is that every public product query must now exclude owned rows;
-- see the ownerId IS NULL filters in routes/products.ts.
--
-- The cut-out image lives in its own table so that listing the catalogue never reads image bytes.

ALTER TABLE "Product" ADD COLUMN "ownerId" TEXT;

CREATE INDEX "Product_ownerId_idx" ON "Product"("ownerId");

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'image/png',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductImage_productId_key" ON "ProductImage"("productId");

ALTER TABLE "ProductImage"
  ADD CONSTRAINT "ProductImage_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
