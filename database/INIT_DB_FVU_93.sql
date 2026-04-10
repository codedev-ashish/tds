-- INIT_DB_FVU_93.sql
-- Complete database initialization with FVU 9.3 compliance
-- This is the master initialization file - run this ONCE after fresh database creation

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'practitioner') DEFAULT 'practitioner',
    status ENUM('active', 'banned') DEFAULT 'active',
    plan ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic',
    last_login DATETIME,
    location VARCHAR(255),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create deductors table with FVU 9.3 compliance fields
CREATE TABLE IF NOT EXISTS deductors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    tan VARCHAR(10) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    name VARCHAR(255) NOT NULL,
    branch VARCHAR(255),
    type ENUM('Individual', 'Company', 'Partnership', 'Government') NOT NULL,
    flat VARCHAR(255),
    building VARCHAR(255),
    road VARCHAR(255),
    area VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    std VARCHAR(10),
    phone VARCHAR(20) NOT NULL,
    alt_std VARCHAR(10),
    alt_phone VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    alt_email VARCHAR(255),
    -- Responsible Person
    responsible_person VARCHAR(255) NOT NULL,
    responsible_designation VARCHAR(255) NOT NULL,
    responsible_father_name VARCHAR(255),
    responsible_mobile VARCHAR(20),
    responsible_pan VARCHAR(10),
    -- Responsible Person Address
    rp_flat VARCHAR(255),
    rp_building VARCHAR(255),
    rp_road VARCHAR(255),
    rp_area VARCHAR(255),
    rp_city VARCHAR(255),
    rp_state VARCHAR(255),
    rp_pincode VARCHAR(10),
    rp_std VARCHAR(10),
    rp_phone VARCHAR(20),
    rp_alt_std VARCHAR(10),
    rp_alt_phone VARCHAR(20),
    rp_email VARCHAR(255),
    rp_alt_email VARCHAR(255),
    -- Government Details
    gov_pao_code VARCHAR(20),
    gov_pao_reg_no VARCHAR(20),
    gov_ddo_code VARCHAR(20),
    gov_ddo_reg_no VARCHAR(20),
    gov_state VARCHAR(255),
    gov_ministry VARCHAR(255),
    gov_other_ministry VARCHAR(255),
    gov_ain VARCHAR(20),
    -- FVU 9.3 Mandatory Fields (T-FV-2084)
    deductor_code ENUM('D', 'C') DEFAULT 'D' COMMENT 'D=Deductor, C=Collector',
    address_change_flag ENUM('Y', 'N') DEFAULT 'N' COMMENT 'Y=Address changed since last return, N=No change',
    pan_reference_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tan (tan),
    INDEX idx_user_id (user_id)
);

-- 3. Create deductees table
CREATE TABLE IF NOT EXISTS deductees (
    id VARCHAR(36) PRIMARY KEY,
    deductor_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    code ENUM('01', '02') NOT NULL COMMENT '01=Company, 02=Non-Company',
    deductee_status ENUM('O', 'A') DEFAULT 'O' COMMENT 'O=Ordinary, A=Alternate',
    buyer_seller_flag ENUM('1', '2') DEFAULT '2' COMMENT '1=Buyer, 2=Seller',
    email VARCHAR(255),
    mobile VARCHAR(20),
    address TEXT,
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    INDEX idx_deductor_id (deductor_id),
    INDEX idx_pan (pan)
);

-- 4. Create challans table
CREATE TABLE IF NOT EXISTS challans (
    id VARCHAR(36) PRIMARY KEY,
    deductor_id VARCHAR(36) NOT NULL,
    bsr_code VARCHAR(7) NOT NULL,
    date DATE NOT NULL,
    serial_no VARCHAR(10) NOT NULL,
    tds DECIMAL(15, 2) DEFAULT 0,
    surcharge DECIMAL(15, 2) DEFAULT 0,
    education_cess DECIMAL(15, 2) DEFAULT 0,
    interest DECIMAL(15, 2) DEFAULT 0,
    fee DECIMAL(15, 2) DEFAULT 0,
    others DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,
    minor_head VARCHAR(50),
    interest_allocated DECIMAL(15, 2) DEFAULT 0,
    others_allocated DECIMAL(15, 2) DEFAULT 0,
    quarter VARCHAR(2),
    financial_year VARCHAR(7),
    status ENUM('Draft', 'Submitted', 'Rejected') DEFAULT 'Draft',
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    INDEX idx_deductor_id (deductor_id),
    INDEX idx_financial_year (financial_year),
    INDEX idx_quarter (quarter)
);

-- 5. Create deduction_entries table
CREATE TABLE IF NOT EXISTS deduction_entries (
    id VARCHAR(36) PRIMARY KEY,
    deductor_id VARCHAR(36) NOT NULL,
    challan_id VARCHAR(36) NOT NULL,
    deductee_id VARCHAR(36),
    section VARCHAR(10) NOT NULL,
    payment_date DATE NOT NULL,
    deducted_date DATE NOT NULL,
    amount_of_payment DECIMAL(15, 2),
    total_tax DECIMAL(15, 2),
    surcharge DECIMAL(15, 2),
    cess DECIMAL(15, 2),
    tax_deposited DECIMAL(15, 2),
    rate DECIMAL(5, 4),
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    FOREIGN KEY (challan_id) REFERENCES challans(id) ON DELETE CASCADE,
    FOREIGN KEY (deductee_id) REFERENCES deductees(id) ON DELETE SET NULL,
    INDEX idx_challan_id (challan_id),
    INDEX idx_deductee_id (deductee_id),
    INDEX idx_section (section)
);

-- 6. Create tds_returns table
CREATE TABLE IF NOT EXISTS tds_returns (
    id VARCHAR(36) PRIMARY KEY,
    deductor_id VARCHAR(36) NOT NULL,
    financial_year VARCHAR(7),
    quarter VARCHAR(2),
    form_no VARCHAR(10),
    status ENUM('Draft', 'Submitted', 'Acknowledged', 'Rejected') DEFAULT 'Draft',
    type ENUM('Original', 'Correction') DEFAULT 'Original',
    previous_token_number VARCHAR(15),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    INDEX idx_deductor_id (deductor_id),
    INDEX idx_financial_year (financial_year),
    UNIQUE KEY unique_return (deductor_id, financial_year, quarter, type)
);

-- 7. Create other tables for completeness
CREATE TABLE IF NOT EXISTS news (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    subject VARCHAR(255),
    description TEXT,
    status ENUM('Open', 'In Progress', 'Closed') DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    price DECIMAL(10, 2),
    features TEXT
);

CREATE TABLE IF NOT EXISTS ads (
    id VARCHAR(36) PRIMARY KEY,
    content TEXT,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    message TEXT,
    `read` BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. FVU 9.3 Compliance Checks - Ensure mandatory fields
ALTER TABLE deductors MODIFY address_change_flag ENUM('Y', 'N') DEFAULT 'N' NOT NULL;
ALTER TABLE deductors MODIFY deductor_code ENUM('D', 'C') DEFAULT 'D' NOT NULL;
ALTER TABLE deductees MODIFY deductee_status ENUM('O', 'A') DEFAULT 'O' NOT NULL;
ALTER TABLE deductees MODIFY buyer_seller_flag ENUM('1', '2') DEFAULT '2' NOT NULL;

-- 9. Set all existing records to defaults if needed
UPDATE deductors SET deductor_code = 'D' WHERE deductor_code IS NULL;
UPDATE deductors SET address_change_flag = 'N' WHERE address_change_flag IS NULL;
UPDATE deductees SET deductee_status = 'O' WHERE deductee_status IS NULL;
UPDATE deductees SET buyer_seller_flag = '2' WHERE buyer_seller_flag IS NULL;

-- 10. Create reference table for state codes (optional but helpful)
DROP TABLE IF EXISTS state_codes;
CREATE TABLE state_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(2) UNIQUE,
    name VARCHAR(100),
    abbreviation VARCHAR(5),
    type ENUM('State', 'Union Territory') DEFAULT 'State'
);

-- Insert state codes (as per Indian tax system)
INSERT INTO state_codes (code, name, abbreviation, type) VALUES
('01', 'Andhra Pradesh', 'AP', 'State'),
('02', 'Arunachal Pradesh', 'AR', 'State'),
('03', 'Assam', 'AS', 'State'),
('04', 'Bihar', 'BR', 'State'),
('05', 'Chhattisgarh', 'CG', 'State'),
('06', 'Goa', 'GA', 'State'),
('07', 'Gujarat', 'GJ', 'State'),
('08', 'Haryana', 'HR', 'State'),
('09', 'Himachal Pradesh', 'HP', 'State'),
('10', 'Jharkhand', 'JH', 'State'),
('11', 'Karnataka', 'KA', 'State'),
('12', 'Kerala', 'KL', 'State'),
('13', 'Madhya Pradesh', 'MP', 'State'),
('14', 'Maharashtra', 'MH', 'State'),
('15', 'Manipur', 'MN', 'State'),
('16', 'Meghalaya', 'ML', 'State'),
('17', 'Mizoram', 'MZ', 'State'),
('18', 'Nagaland', 'NL', 'State'),
('19', 'Odisha', 'OD', 'State'),
('20', 'Punjab', 'PB', 'State'),
('21', 'Rajasthan', 'RJ', 'State'),
('22', 'Sikkim', 'SK', 'State'),
('23', 'Tamil Nadu', 'TN', 'State'),
('24', 'Telangana', 'TG', 'State'),
('25', 'Tripura', 'TR', 'State'),
('26', 'Uttar Pradesh', 'UP', 'State'),
('27', 'Uttarakhand', 'UT', 'State'),
('28', 'West Bengal', 'WB', 'State'),
('29', 'Andaman and Nicobar Islands', 'AN', 'Union Territory'),
('30', 'Chandigarh', 'CH', 'Union Territory'),
('31', 'Dadra and Nagar Haveli and Daman and Diu', 'DN', 'Union Territory'),
('32', 'Lakshadweep', 'LD', 'Union Territory'),
('33', 'Delhi', 'DL', 'Union Territory'),
('34', 'Puducherry', 'PY', 'Union Territory'),
('35', 'Ladakh', 'LA', 'Union Territory'),
('36', 'Jammu and Kashmir', 'JK', 'Union Territory'),
('37', 'Tamil Nadu', 'TN', 'State'),
('38', 'Ghazipur', 'GP', 'District');

-- Show completion status
SELECT 'Database initialization complete. FVU 9.3 ready.' as Status;
SELECT COUNT(*) as DeductorCount FROM deductors;
SELECT COUNT(*) as DeducteeCount FROM deductees;
SELECT COUNT(*) as ChallanCount FROM challans;
SELECT COUNT(*) as DeductionCount FROM deduction_entries;
