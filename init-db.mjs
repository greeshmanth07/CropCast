import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.akfpuhvlsafpafivwxnr:Kingofstates1119@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function init() {
  try {
    await client.connect();
    console.log('Connected to Supabase. Creating tables if not exist...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        "openId" VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        "loginMethod" VARCHAR(64),
        role VARCHAR(32) DEFAULT 'user' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "farmerProfiles" (
        id SERIAL PRIMARY KEY,
        mobile VARCHAR(10) NOT NULL UNIQUE,
        "fullName" VARCHAR(120) NOT NULL,
        location VARCHAR(255) NOT NULL,
        language VARCHAR(32) DEFAULT 'English' NOT NULL,
        "accountRole" VARCHAR(32) DEFAULT 'farmer' NOT NULL,
        "recentCrops" TEXT,
        watchlist TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "produceListings" (
        id SERIAL PRIMARY KEY,
        "farmerMobile" VARCHAR(10) NOT NULL,
        "sellerName" VARCHAR(160) NOT NULL,
        crop VARCHAR(64) NOT NULL,
        "quantityKg" INTEGER NOT NULL,
        "availableKg" INTEGER NOT NULL,
        quality VARCHAR(80) NOT NULL,
        location VARCHAR(255) NOT NULL,
        "harvestDate" VARCHAR(32) NOT NULL,
        "pricePerKg" INTEGER NOT NULL,
        status VARCHAR(32) DEFAULT 'available' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "buyerRequirements" (
        id SERIAL PRIMARY KEY,
        "buyerName" VARCHAR(160) NOT NULL,
        "buyerType" VARCHAR(80) NOT NULL,
        crop VARCHAR(64) NOT NULL,
        "quantityKg" INTEGER NOT NULL,
        quality VARCHAR(80) NOT NULL,
        location VARCHAR(255) NOT NULL,
        "requiredDate" VARCHAR(32) NOT NULL,
        "maxPricePerKg" INTEGER NOT NULL,
        status VARCHAR(32) DEFAULT 'open' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "marketplaceOrders" (
        id SERIAL PRIMARY KEY,
        "listingId" INTEGER NOT NULL,
        "requirementId" INTEGER,
        "buyerName" VARCHAR(160) NOT NULL,
        "quantityKg" INTEGER NOT NULL,
        "pricePerKg" INTEGER NOT NULL,
        "totalAmount" INTEGER NOT NULL,
        status VARCHAR(32) DEFAULT 'confirmed' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "logisticsRoutes" (
        id SERIAL PRIMARY KEY,
        "orderId" INTEGER NOT NULL UNIQUE,
        "routeName" VARCHAR(160) NOT NULL,
        "pickupPoints" TEXT NOT NULL,
        "deliveryLocation" VARCHAR(255) NOT NULL,
        "distanceKm" INTEGER NOT NULL,
        "etaMinutes" INTEGER NOT NULL,
        "vehicleCapacityKg" INTEGER NOT NULL,
        "consolidationCount" INTEGER DEFAULT 1 NOT NULL,
        status VARCHAR(32) DEFAULT 'planned' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log('SUCCESS: All Supabase tables created successfully!');
    await client.end();
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
}

init();
