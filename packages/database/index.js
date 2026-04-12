// packages/database/index.js

const { PrismaClient,Prisma } = require('@prisma/client');

/**
 * Standard Prisma 5 initialization
 * Works with Docker, Node services, and Python Prisma client
 */

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = { prisma, PrismaClient,Decimal: Prisma.Decimal };