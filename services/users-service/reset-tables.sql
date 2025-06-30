-- Simple solution: Drop and recreate tables
-- WARNING: This will delete ALL data in locations and payment_methods tables

-- Drop tables (in order due to potential foreign keys)
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- The tables will be recreated automatically when you restart the service
-- with DB_SYNC=true, and they will have the correct schema with user_id as VARCHAR 