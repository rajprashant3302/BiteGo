// // packages/database/index.js
// const { Pool } = require('pg');
// const { PrismaPg } = require('@prisma/adapter-pg');
// const { PrismaClient } = require('@prisma/client');

// // 1. Create the Postgres Pool (Using the 'pg' library)
// const pool = new Pool({ 
//   connectionString: process.env.DATABASE_URL 
// });

// // 2. Create the Prisma Adapter (This is what Prisma v7 needs)
// const adapter = new PrismaPg(pool);

// // 3. Initialize Prisma Client with the Adapter
// const prisma = new PrismaClient({ adapter });

// // 4. Export the READY-TO-USE instance
// module.exports = { prisma, PrismaClient };


const { PrismaClient } = require('@prisma/client');

/**
 * Prisma 5 standard initialization
 * No need for 'pg' pool or 'PrismaPg' adapter here 
 * unless you are using complex serverless edge functions.
 */
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
});

module.exports = { prisma, PrismaClient };