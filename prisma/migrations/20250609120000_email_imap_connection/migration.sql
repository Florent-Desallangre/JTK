-- CreateEnum
CREATE TYPE "EmailConnectionType" AS ENUM ('oauth', 'imap');

-- AlterTable
ALTER TABLE "EmailAccount" ADD COLUMN "connectionType" "EmailConnectionType" NOT NULL DEFAULT 'oauth';
ALTER TABLE "EmailAccount" ADD COLUMN "imapHost" TEXT;
ALTER TABLE "EmailAccount" ADD COLUMN "imapPort" INTEGER;
ALTER TABLE "EmailAccount" ADD COLUMN "smtpHost" TEXT;
ALTER TABLE "EmailAccount" ADD COLUMN "smtpPort" INTEGER;
