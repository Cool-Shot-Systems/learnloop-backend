-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "verification_tokens" ADD COLUMN "usedAt" TIMESTAMP(3);
