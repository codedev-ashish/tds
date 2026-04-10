-- Migration: Add State Code Reference Table and Constraints
-- Date: January 28, 2026
-- Purpose: Implement proper numeric state code handling per TDS FVU 9.3 requirements
-- Reference: TDS_Seperator_Implementation_Guide.pdf

-- Create state_codes reference table
CREATE TABLE IF NOT EXISTS state_codes (
    code CHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('State', 'UT', 'Special') NOT NULL COMMENT 'State, Union Territory, or Special Code',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert all valid state and UT codes
INSERT IGNORE INTO state_codes (code, name, type) VALUES
-- States (29 States)
('01', 'Jammu & Kashmir', 'UT'),
('02', 'Himachal Pradesh', 'State'),
('03', 'Punjab', 'State'),
('04', 'Chandigarh', 'UT'),
('05', 'Uttarakhand', 'State'),
('06', 'Haryana', 'State'),
('07', 'Delhi (NCT)', 'UT'),
('08', 'Rajasthan', 'State'),
('10', 'Bihar', 'State'),
('11', 'Sikkim', 'State'),
('12', 'Arunachal Pradesh', 'State'),
('13', 'Nagaland', 'State'),
('14', 'Manipur', 'State'),
('15', 'Mizoram', 'State'),
('16', 'Tripura', 'State'),
('17', 'Meghalaya', 'State'),
('18', 'Assam', 'State'),
('19', 'West Bengal', 'State'),
('20', 'Jharkhand', 'State'),
('21', 'Odisha', 'State'),
('22', 'Chhattisgarh', 'State'),
('23', 'Madhya Pradesh', 'State'),
('24', 'Gujarat', 'State'),
('26', 'Dadra & Nagar Haveli', 'UT'),
('27', 'Maharashtra', 'State'),
('28', 'Andhra Pradesh', 'State'),
('29', 'Karnataka', 'State'),
('30', 'Goa', 'State'),
('31', 'Uttar Pradesh', 'State'),
('32', 'Kerala', 'State'),
('33', 'Tamil Nadu', 'State'),
('34', 'Puducherry', 'UT'),
('35', 'Andaman & Nicobar', 'UT'),
('36', 'Telangana', 'State'),
('38', 'Ladakh', 'UT'),
('99', 'Outside India', 'Special');

-- Add CHECK constraint to deductors table for state codes
-- NOTE: This is for future migration. Current implementation stores state names.
-- ALTER TABLE deductors ADD CONSTRAINT chk_state_code CHECK (state REGEXP '^[0-9]{2}$');

-- Query to identify records needing migration (state names to codes)
-- SELECT id, state, name FROM deductors WHERE state NOT REGEXP '^[0-9]{2}$' LIMIT 10;

-- MIGRATION STEPS FOR FUTURE IMPLEMENTATION:
-- 1. Create new column: ALTER TABLE deductors ADD COLUMN state_code CHAR(2);
-- 2. Populate state_code from state using getStateCode() logic
-- 3. Update rp_state similarly: ALTER TABLE deductors ADD COLUMN rp_state_code CHAR(2);
-- 4. Add constraints to new columns
-- 5. Drop old varchar columns after validation
-- 6. Create indexes on numeric state codes for performance

-- FOR NOW: The application layer (getStateCode() in tds_generator.js) converts
-- state names/abbreviations to numeric codes during file generation.
-- This ensures backward compatibility while maintaining FVU compliance.

-- Validation query to check current state usage
-- SELECT DISTINCT state FROM deductors ORDER BY state;
-- SELECT DISTINCT rp_state FROM deductors WHERE rp_state IS NOT NULL ORDER BY rp_state;
