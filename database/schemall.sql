-- ============================================================================
-- TDS Pro Database Schema - All-in-One Master Script (schemall.sql)
-- Consolidates base schema, FVU 9.3 compliance, and reference data
-- ============================================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS tds_pro_db;
CREATE DATABASE tds_pro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tds_pro_db;

-- ============================================================================
-- 1. REFERENCE TABLES
-- ============================================================================

-- State Codes Table (Indian Tax System)
DROP TABLE IF EXISTS state_codes;
CREATE TABLE state_codes (
    code CHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('State', 'UT', 'Special') NOT NULL COMMENT 'State, Union Territory, or Special Code',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================================
-- 2. CORE TABLES (in dependency order)
-- ============================================================================

-- Users Table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'practitioner') DEFAULT 'practitioner',
    status ENUM('active', 'banned') DEFAULT 'active',
    plan ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic',
    last_login DATETIME,
    location VARCHAR(255),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Deductors Table (with FVU 9.3 compliance)
DROP TABLE IF EXISTS deductors;
CREATE TABLE deductors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    tan VARCHAR(10) NOT NULL UNIQUE,
    pan VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    name VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    type ENUM(
        'Individual',
        'Company',
        'Partnership',
        'Government'
    ) NOT NULL,
    flat VARCHAR(255),
    building VARCHAR(255) NOT NULL,
    locality VARCHAR(255),
    street VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL,
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
    rp_building VARCHAR(255) NOT NULL,
    rp_locality VARCHAR(255),
    rp_street VARCHAR(255) NOT NULL,
    rp_area VARCHAR(255) NOT NULL,
    rp_city VARCHAR(255),
    rp_state VARCHAR(255),
    rp_pincode VARCHAR(10),
    rp_std VARCHAR(10),
    rp_phone VARCHAR(20) NOT NULL,
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
    
    -- FVU 9.3 Mandatory Fields
    deductor_code ENUM('D', 'C') DEFAULT 'D' NOT NULL,
    address_change_flag ENUM('Y', 'N') DEFAULT 'N' NOT NULL,
    it_password VARCHAR(255),
    pan_reference_number VARCHAR(20),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_tan (tan),
    INDEX idx_pan (pan)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Deductees Table (with FVU 9.3 compliance)
DROP TABLE IF EXISTS deductees;
CREATE TABLE deductees (
    id VARCHAR(36) PRIMARY KEY,
    deductor_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    code ENUM('01', '02') NOT NULL,
    deductee_status ENUM('O', 'A') DEFAULT 'O' NOT NULL,
    buyer_seller_flag ENUM('1', '2') DEFAULT '2' NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(20),
    address TEXT,
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    INDEX idx_deductor_id (deductor_id),
    INDEX idx_pan (pan)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Challans Table (with FVU 9.3 compliance)
DROP TABLE IF EXISTS challans;
CREATE TABLE challans (
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
    minor_head ENUM('200', '400') NOT NULL,
    interest_allocated DECIMAL(15, 2) DEFAULT 0,
    others_allocated DECIMAL(15, 2) DEFAULT 0,
    quarter ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    status ENUM('Draft', 'Generated') DEFAULT 'Draft',
    
    -- FVU 9.3 Mandatory Fields
    nil_challan ENUM('Y', 'N') DEFAULT 'N',
    tender_date DATE,
    nature_of_payment VARCHAR(10),
    
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    INDEX idx_deductor_id (deductor_id),
    INDEX idx_quarter_fy (quarter, financial_year),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Deduction Entries Table
DROP TABLE IF EXISTS deduction_entries;
CREATE TABLE deduction_entries (
    id VARCHAR(36) PRIMARY KEY,
    deductor_id VARCHAR(36) NOT NULL,
    challan_id VARCHAR(36) NOT NULL,
    deductee_id VARCHAR(36) NOT NULL,
    section VARCHAR(10) NOT NULL,
    payment_date DATE NOT NULL,
    deducted_date DATE NOT NULL,
    amount_of_payment DECIMAL(15, 2) DEFAULT 0,
    rate DECIMAL(5, 2) DEFAULT 0,
    income_tax DECIMAL(15, 2) DEFAULT 0,
    surcharge DECIMAL(15, 2) DEFAULT 0,
    cess DECIMAL(15, 2) DEFAULT 0,
    total_tax DECIMAL(15, 2) DEFAULT 0,
    tax_deposited DECIMAL(15, 2) DEFAULT 0,
    remarks VARCHAR(255),
    certificate_no VARCHAR(50),
    status ENUM('Draft', 'Generated') DEFAULT 'Draft',
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    FOREIGN KEY (challan_id) REFERENCES challans(id) ON DELETE CASCADE,
    FOREIGN KEY (deductee_id) REFERENCES deductees(id) ON DELETE CASCADE,
    INDEX idx_deductor_id (deductor_id),
    INDEX idx_challan_id (challan_id),
    INDEX idx_deductee_id (deductee_id),
    INDEX idx_section (section)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- TDS Returns Table
DROP TABLE IF EXISTS tds_returns;
CREATE TABLE tds_returns (
    id VARCHAR(36) PRIMARY KEY,
    deductor_id VARCHAR(36) NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    quarter ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL,
    form_no ENUM('24Q', '26Q', '27Q', '27EQ') NOT NULL,
    form_type VARCHAR(50) NOT NULL,
    status ENUM('Draft', 'Generated') DEFAULT 'Draft',
    type ENUM('Regular', 'Correction') DEFAULT 'Regular',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    previous_token_number VARCHAR(50),
    FOREIGN KEY (deductor_id) REFERENCES deductors(id) ON DELETE CASCADE,
    INDEX idx_deductor_id (deductor_id),
    INDEX idx_fy_quarter (financial_year, quarter),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================================
-- 3. AUXILIARY TABLES
-- ============================================================================

-- News Table
DROP TABLE IF EXISTS news;
CREATE TABLE news (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('general', 'update', 'maintenance') NOT NULL,
    priority ENUM('normal', 'high') DEFAULT 'normal',
    date DATE NOT NULL,
    INDEX idx_date (date),
    INDEX idx_type (type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Support Tickets Table
DROP TABLE IF EXISTS support_tickets;
CREATE TABLE support_tickets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('bug', 'error', 'help', 'other') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in-progress', 'resolved') DEFAULT 'open',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolution TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_date (date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Ad Units Table
DROP TABLE IF EXISTS ad_units;
CREATE TABLE ad_units (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50),
    type ENUM('Banner', 'Image', 'Script') NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    content TEXT,
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Subscription Plans Table
DROP TABLE IF EXISTS subscription_plans;
CREATE TABLE subscription_plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    period ENUM('monthly', 'yearly') DEFAULT 'monthly',
    features TEXT,
    limits TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Chat Messages Table
DROP TABLE IF EXISTS chat_messages;
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_timestamp (timestamp)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Notifications Table
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    audience VARCHAR(50) DEFAULT 'all',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    type ENUM('info', 'alert', 'promo') DEFAULT 'info',
    INDEX idx_sent_at (sent_at),
    INDEX idx_type (type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Validation Logs Table
DROP TABLE IF EXISTS csi_validation_logs;
CREATE TABLE csi_validation_logs (
    id VARCHAR(36) PRIMARY KEY,
    return_id VARCHAR(36) NOT NULL,
    status ENUM('success', 'failure') NOT NULL,
    file_name VARCHAR(255),
    total_challans INT DEFAULT 0,
    matched_challans INT DEFAULT 0,
    unmatched_challans INT DEFAULT 0,
    report_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES tds_returns(id) ON DELETE CASCADE,
    INDEX idx_return_id (return_id),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Settings Table
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
    `key` VARCHAR(255) PRIMARY KEY,
    `value` LONGTEXT,
    `group` VARCHAR(50) DEFAULT 'general',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_group (`group`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================================
-- 4. INSERT INITIAL DATA
-- ============================================================================

-- Insert State Codes
INSERT IGNORE INTO state_codes (code, name, type) VALUES
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

-- Insert Default Admin User
INSERT INTO users (id, name, email, password_hash, role, status, plan, joined_at)
VALUES ('admin', 'System Administrator', 'admin@tdspro.com', 'admin123', 'admin', 'active', 'enterprise', NOW());

-- Insert Default Settings
INSERT INTO settings (`key`, `value`, `group`)
VALUES ('gemini_api_key', '', 'ai'),
       ('app_name', 'TDS Pro Assistant', 'general'),
       ('app_version', '1.0.0', 'general'),
       ('maintenance_mode', 'false', 'general');

-- ============================================================================
-- DATABASE READY
-- ============================================================================
