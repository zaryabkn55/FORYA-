-- Default the launch market to the United Kingdom.
--
-- These columns were left over from an earlier build and defaulted to Pakistan/PK, so any row
-- created without them — an OAuth placeholder account, a seeded user, a direct insert — came out
-- in the wrong market.
--
-- Column defaults only. Existing rows are deliberately left alone: a row reading 'Pakistan' may
-- be a member who genuinely chose it from the registration list, and there is no way to tell
-- that apart from the old default after the fact. If you want the ones created before launch
-- rewritten, do it as a one-off with the launch date as the cut-off, e.g.
--   UPDATE "User" SET country = 'United Kingdom', "countryCode" = 'GB'
--    WHERE country = 'Pakistan' AND "createdAt" < '2026-10-22';

ALTER TABLE "User" ALTER COLUMN "country" SET DEFAULT 'United Kingdom';
ALTER TABLE "User" ALTER COLUMN "countryCode" SET DEFAULT 'GB';
