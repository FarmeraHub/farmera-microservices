-- Farmera Microservices Platform - Database Initialization
-- This script sets up the initial databases and users for all microservices

-- Create databases for each service
CREATE DATABASE users_service_db;
CREATE DATABASE products_service_db;
CREATE DATABASE payment_service_db;
CREATE DATABASE notification_service_db;
CREATE DATABASE communication_service_db;

-- Create service-specific users (optional, for production use different credentials)
CREATE USER users_service WITH ENCRYPTED PASSWORD 'users_service_pass';
CREATE USER products_service WITH ENCRYPTED PASSWORD 'products_service_pass';
CREATE USER payment_service WITH ENCRYPTED PASSWORD 'payment_service_pass';
CREATE USER notification_service WITH ENCRYPTED PASSWORD 'notification_service_pass';
CREATE USER communication_service WITH ENCRYPTED PASSWORD 'communication_service_pass';

-- Grant privileges to service users
GRANT ALL PRIVILEGES ON DATABASE users_service_db TO users_service;
GRANT ALL PRIVILEGES ON DATABASE products_service_db TO products_service;
GRANT ALL PRIVILEGES ON DATABASE payment_service_db TO payment_service;
GRANT ALL PRIVILEGES ON DATABASE notification_service_db TO notification_service;
GRANT ALL PRIVILEGES ON DATABASE communication_service_db TO communication_service;

-- Grant privileges to the main farmera user for all databases (for development)
GRANT ALL PRIVILEGES ON DATABASE users_service_db TO farmera;
GRANT ALL PRIVILEGES ON DATABASE products_service_db TO farmera;
GRANT ALL PRIVILEGES ON DATABASE payment_service_db TO farmera;
GRANT ALL PRIVILEGES ON DATABASE notification_service_db TO farmera;
GRANT ALL PRIVILEGES ON DATABASE communication_service_db TO farmera;

-- Connect to each database and create extensions
\c users_service_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c products_service_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c payment_service_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c notification_service_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c communication_service_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Return to main database
\c farmera_platform;

-- Log successful initialization
INSERT INTO information_schema.tables (table_name) VALUES ('FARMERA_INIT_COMPLETE') ON CONFLICT DO NOTHING; 