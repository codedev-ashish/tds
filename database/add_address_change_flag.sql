-- Migration: Add Address Change Indicator flag to deductors table
-- Purpose: Track whether deductor address has changed since last return (FVU 9.3 requirement)

-- Add column only if it doesn't already exist
ALTER TABLE deductors ADD COLUMN IF NOT EXISTS address_change_flag ENUM('Y', 'N') DEFAULT 'N' AFTER deductor_code;

-- This field will be:
-- 'Y' = Address has changed since last return (mandatory disclosure in BH record position 38)
-- 'N' = Address remains same as last return (default)

-- For existing deductors, ensure field is set to 'N' if NULL
UPDATE deductors SET address_change_flag = 'N' WHERE address_change_flag IS NULL OR address_change_flag = '';
