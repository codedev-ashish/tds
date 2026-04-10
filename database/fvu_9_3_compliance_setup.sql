-- Database Maintenance & Setup for FVU 9.3 Compliance
-- Run this after schema updates to ensure all required fields are populated
-- 1. Add address_change_flag column if not exists
ALTER TABLE deductors
ADD COLUMN IF NOT EXISTS address_change_flag ENUM('Y', 'N') DEFAULT 'N'
AFTER deductor_code;
-- 2. Update all existing deductors to have proper defaults if missing
UPDATE deductors
SET address_change_flag = 'N'
WHERE address_change_flag IS NULL;
UPDATE deductors
SET deductor_code = 'D'
WHERE deductor_code IS NULL
    OR deductor_code = '';
-- 3. Ensure all deductors have required fields set
UPDATE deductors
SET responsible_person = COALESCE(responsible_person, name, 'UNKNOWN'),
    responsible_designation = COALESCE(responsible_designation, 'PROPRIETOR'),
    responsible_mobile = COALESCE(responsible_mobile, '9000000000'),
    responsible_pan = COALESCE(responsible_pan, pan)
WHERE responsible_person IS NULL
    OR responsible_designation IS NULL
    OR responsible_mobile IS NULL
    OR responsible_pan IS NULL;
-- 4. Ensure Responsible Person address is set (copy from company address if needed)
UPDATE deductors d
SET rp_flat = COALESCE(d.rp_flat, d.flat, 'UNKNOWN'),
    rp_building = COALESCE(d.rp_building, d.building, 'NA'),
    rp_street = COALESCE(d.rp_street, d.street, 'NA'),
    rp_city = COALESCE(d.rp_city, d.city),
    rp_state = COALESCE(d.rp_state, d.state),
    rp_pincode = COALESCE(d.rp_pincode, d.pincode),
    rp_email = COALESCE(d.rp_email, d.email),
    rp_std = COALESCE(d.rp_std, d.std),
    rp_phone = COALESCE(d.rp_phone, d.phone)
WHERE d.rp_flat IS NULL
    OR d.rp_city IS NULL
    OR d.rp_state IS NULL
    OR d.rp_pincode IS NULL;
-- 5. Verify deductees have all required fields
ALTER TABLE deductees
ADD COLUMN IF NOT EXISTS deductee_status ENUM('O', 'A') DEFAULT 'O'
AFTER code;
ALTER TABLE deductees
ADD COLUMN IF NOT EXISTS buyer_seller_flag ENUM('1', '2') DEFAULT '2'
AFTER deductee_status;
UPDATE deductees
SET deductee_status = 'O'
WHERE deductee_status IS NULL;
UPDATE deductees
SET buyer_seller_flag = '2'
WHERE buyer_seller_flag IS NULL;
-- 6. Verify state codes are properly formatted (should be 2 digits)
-- This is handled by getStateCode() in TDS generator, but verify it exists in reference
-- 7. Show summary of updated records
SELECT 'Deductors Ready for FVU' as Category,
    COUNT(*) as Count,
    SUM(
        CASE
            WHEN address_change_flag IN ('Y', 'N') THEN 1
            ELSE 0
        END
    ) as WithAddressFlag,
    SUM(
        CASE
            WHEN deductor_code IN ('D', 'C') THEN 1
            ELSE 0
        END
    ) as WithDeductorCode
FROM deductors;
SELECT 'Deductees Ready for FVU' as Category,
    COUNT(*) as Count,
    SUM(
        CASE
            WHEN deductee_status IN ('O', 'A') THEN 1
            ELSE 0
        END
    ) as WithStatus,
    SUM(
        CASE
            WHEN buyer_seller_flag IN ('1', '2') THEN 1
            ELSE 0
        END
    ) as WithBuyerSellerFlag,
    SUM(
        CASE
            WHEN pan IS NOT NULL
            AND pan != '' THEN 1
            ELSE 0
        END
    ) as WithPAN
FROM deductees;
-- 8. Show deduction entries with missing deductees
SELECT COUNT(*) as MissingDeducteeRecords
FROM deduction_entries de
WHERE de.deductee_id IS NULL
    OR de.deductee_id = '';