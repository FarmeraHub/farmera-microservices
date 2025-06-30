-- Migration: Create Process Template System Tables
-- Created: 2024-01-XX
-- Description: Adds process templates, steps, product assignments, and step-based diary entries

-- Create process_templates table
CREATE TABLE IF NOT EXISTS process_templates (
  process_id SERIAL PRIMARY KEY,
  process_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  farm_id UUID NOT NULL REFERENCES farm(farm_id) ON DELETE CASCADE,
  estimated_duration_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create process_steps table
CREATE TABLE IF NOT EXISTS process_steps (
  step_id SERIAL PRIMARY KEY,
  process_id INTEGER NOT NULL REFERENCES process_templates(process_id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  estimated_duration_days INTEGER,
  instructions TEXT,
  created TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(process_id, step_order)
);

-- Create assignment status enum
CREATE TYPE assignment_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- Create product_process_assignments table
CREATE TABLE IF NOT EXISTS product_process_assignments (
  assignment_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  process_id INTEGER NOT NULL REFERENCES process_templates(process_id) ON DELETE CASCADE,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  status assignment_status DEFAULT 'ACTIVE',
  current_step_order INTEGER,
  completion_percentage DECIMAL(5,2) DEFAULT 0.0,
  start_date TIMESTAMPTZ,
  target_completion_date TIMESTAMPTZ,
  actual_completion_date TIMESTAMPTZ,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, status) DEFERRABLE INITIALLY DEFERRED -- Only one active assignment per product
);

-- Create diary completion status enum
CREATE TYPE diary_completion_status AS ENUM ('IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- Create step_diary_entries table
CREATE TABLE IF NOT EXISTS step_diary_entries (
  diary_id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES product_process_assignments(assignment_id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES process_steps(step_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_order INTEGER NOT NULL,
  notes TEXT NOT NULL,
  completion_status diary_completion_status DEFAULT 'IN_PROGRESS',
  image_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  recorded_date TIMESTAMPTZ NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  weather_conditions VARCHAR(255),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  issues_encountered TEXT,
  additional_data JSONB,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_process_templates_farm_id ON process_templates(farm_id);
CREATE INDEX IF NOT EXISTS idx_process_templates_is_active ON process_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_process_steps_process_id ON process_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_process_steps_order ON process_steps(process_id, step_order);
CREATE INDEX IF NOT EXISTS idx_product_assignments_product_id ON product_process_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_assignments_status ON product_process_assignments(status);
CREATE INDEX IF NOT EXISTS idx_step_diary_assignment_id ON step_diary_entries(assignment_id);
CREATE INDEX IF NOT EXISTS idx_step_diary_product_step ON step_diary_entries(product_id, step_id);
CREATE INDEX IF NOT EXISTS idx_step_diary_recorded_date ON step_diary_entries(recorded_date);

-- Add constraints to ensure data integrity
ALTER TABLE product_process_assignments 
ADD CONSTRAINT check_completion_percentage 
CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- Add unique constraint for active assignments (only one active assignment per product)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment 
ON product_process_assignments(product_id) 
WHERE status = 'ACTIVE';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_process_templates_updated_at 
    BEFORE UPDATE ON process_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_assignments_updated_at 
    BEFORE UPDATE ON product_process_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_diary_updated_at 
    BEFORE UPDATE ON step_diary_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
-- Sample process template
INSERT INTO process_templates (process_name, description, farm_id, estimated_duration_days) 
VALUES 
  ('Trồng rau sạch', 'Quy trình trồng rau sạch từ gieo hạt đến thu hoạch', 
   (SELECT farm_id FROM farm LIMIT 1), 90),
  ('Chăn nuôi gà thả vườn', 'Quy trình chăn nuôi gà thả vườn theo tiêu chuẩn VietGAP', 
   (SELECT farm_id FROM farm LIMIT 1), 120);

-- Sample process steps for "Trồng rau sạch"
INSERT INTO process_steps (process_id, step_order, step_name, step_description, estimated_duration_days) 
VALUES 
  (1, 1, 'Chuẩn bị đất', 'Làm đất, bón phân hữu cơ', 3),
  (1, 2, 'Gieo hạt', 'Gieo hạt giống đã tuyển chọn', 1),
  (1, 3, 'Chăm sóc cây con', 'Tưới nước, phòng trừ sâu bệnh', 30),
  (1, 4, 'Thu hoạch', 'Thu hoạch sản phẩm', 2);
*/ 