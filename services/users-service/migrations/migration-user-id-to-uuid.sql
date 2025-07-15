-- Migration: Change user_id from integer to UUID string
-- Run this after cleaning up NULL values

BEGIN;

-- Step 1: Backup existing data (optional)
-- CREATE TABLE locations_backup AS SELECT * FROM locations;
-- CREATE TABLE payment_methods_backup AS SELECT * FROM payment_methods;

-- Step 2: Add temporary columns
ALTER TABLE locations ADD COLUMN user_id_temp VARCHAR;
ALTER TABLE payment_methods ADD COLUMN user_id_temp VARCHAR;

-- Step 3: Handle existing integer user_ids by converting them or setting to valid UUIDs
-- If you have existing integer user_ids that should be preserved, you need to:
-- 1. Map them to actual UUID user IDs, OR
-- 2. Delete them if they're invalid

-- For now, let's assume we want to clear all existing data that has integer user_ids
-- since they won't match UUID format anyway
DELETE FROM locations WHERE user_id IS NOT NULL;
DELETE FROM payment_methods WHERE user_id IS NOT NULL;

-- Step 4: Drop old columns and rename new ones
ALTER TABLE locations DROP COLUMN user_id;
ALTER TABLE locations RENAME COLUMN user_id_temp TO user_id;
ALTER TABLE locations ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE payment_methods DROP COLUMN user_id;
ALTER TABLE payment_methods RENAME COLUMN user_id_temp TO user_id;
ALTER TABLE payment_methods ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add foreign key constraints (optional but recommended)
-- ALTER TABLE locations ADD CONSTRAINT fk_locations_user_id 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_user_id 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

COMMIT; 