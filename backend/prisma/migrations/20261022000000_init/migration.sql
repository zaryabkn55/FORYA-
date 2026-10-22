-- FORYA initial schema.
--
-- This is the baseline migration. Until now the project used `prisma db push`, which is fine
-- on a laptop but has no history and no safe path forward: production needs a migration it can
-- replay and roll forward from. `prisma migrate deploy` applies this, and every later schema
-- change becomes its own migration beside it.

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('AFFORDABLE', 'ATTAINABLE', 'ASPIRATIONAL');

-- CreateEnum
CREATE TYPE "Occasion" AS ENUM ('FORMAL', 'WORK', 'DINNER', 'PARTY', 'HOLIDAY', 'CASUAL');

-- CreateEnum
CREATE TYPE "LookStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'READY');

-- CreateEnum
CREATE TYPE "MomentSource" AS ENUM ('CALENDAR', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Pakistan',
    "countryCode" TEXT NOT NULL DEFAULT 'PK',
    "phone" TEXT,
    "shopsFor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'AFFORDABLE',
    "category" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "numericPrice" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorName" TEXT,
    "material" TEXT,
    "description" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "weather" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rainReady" BOOLEAN NOT NULL DEFAULT false,
    "isStore" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT NOT NULL DEFAULT 'women',
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WardrobeItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "owned" BOOLEAN NOT NULL DEFAULT true,
    "timesWorn" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WardrobeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "occasion" "Occasion" NOT NULL DEFAULT 'CASUAL',
    "date" TIMESTAMP(3) NOT NULL,
    "source" "MomentSource" NOT NULL DEFAULT 'USER',
    "venue" TEXT,
    "notes" TEXT,
    "weatherTemp" INTEGER,
    "weatherDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Look" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "status" "LookStatus" NOT NULL DEFAULT 'DRAFT',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Look_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasPiece" (
    "id" TEXT NOT NULL,
    "lookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "w" DOUBLE PRECISION NOT NULL DEFAULT 26.0,
    "z" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanvasPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedLook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "wear" INTEGER NOT NULL DEFAULT 0,
    "obsessed" INTEGER NOT NULL DEFAULT 0,
    "swap" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedLook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_tier_idx" ON "Product"("tier");

-- CreateIndex
CREATE INDEX "WardrobeItem_userId_idx" ON "WardrobeItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WardrobeItem_userId_productId_key" ON "WardrobeItem"("userId", "productId");

-- CreateIndex
CREATE INDEX "Moment_userId_idx" ON "Moment"("userId");

-- CreateIndex
CREATE INDEX "Moment_date_idx" ON "Moment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Look_momentId_key" ON "Look"("momentId");

-- CreateIndex
CREATE INDEX "CanvasPiece_lookId_idx" ON "CanvasPiece"("lookId");

-- CreateIndex
CREATE INDEX "CanvasPiece_productId_idx" ON "CanvasPiece"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedLook_userId_momentId_key" ON "SharedLook"("userId", "momentId");

-- AddForeignKey
ALTER TABLE "WardrobeItem" ADD CONSTRAINT "WardrobeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WardrobeItem" ADD CONSTRAINT "WardrobeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Look" ADD CONSTRAINT "Look_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasPiece" ADD CONSTRAINT "CanvasPiece_lookId_fkey" FOREIGN KEY ("lookId") REFERENCES "Look"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasPiece" ADD CONSTRAINT "CanvasPiece_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedLook" ADD CONSTRAINT "SharedLook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
