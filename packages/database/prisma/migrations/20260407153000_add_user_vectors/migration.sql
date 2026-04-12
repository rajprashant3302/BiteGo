-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastVectorUpdate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "longTermVector" TEXT;

