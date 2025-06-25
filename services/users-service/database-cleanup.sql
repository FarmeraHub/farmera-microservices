-- Database cleanup script for user_id migration
-- Run this before starting the service

-- 1. Check current data
SELECT COUNT(*) as total_locations FROM locations;
SELECT COUNT(*) as null_user_ids FROM locations WHERE user_id IS NULL;
SELECT COUNT(*) as total_payments FROM payment_methods;
SELECT COUNT(*) as null_payment_user_ids FROM payment_methods WHERE user_id IS NULL;

-- 2. Delete orphaned records (locations without valid user_id)
-- WARNING: This will delete data! Make sure this is what you want.
DELETE FROM locations WHERE user_id IS NULL;
DELETE FROM payment_methods WHERE user_id IS NULL;

-- 3. Verify cleanup
SELECT COUNT(*) as remaining_null_locations FROM locations WHERE user_id IS NULL;
SELECT COUNT(*) as remaining_null_payments FROM payment_methods WHERE user_id IS NULL;

-- 4. If you have locations with numeric user_ids that don't match existing users, clean those too
-- First, let's see what we have:
SELECT DISTINCT user_id FROM locations WHERE user_id IS NOT NULL;
SELECT id FROM users LIMIT 5; -- Check UUID format

-- Clean up locations that reference non-existent users
DELETE FROM locations 
WHERE user_id IS NOT NULL 
AND user_id::text NOT IN (SELECT id FROM users);

DELETE FROM payment_methods 
WHERE user_id IS NOT NULL 
AND user_id::text NOT IN (SELECT id FROM users); 