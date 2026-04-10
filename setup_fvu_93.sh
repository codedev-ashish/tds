#!/bin/bash

# FVU 9.3 Database Setup Script
# This script applies all FVU 9.3 compliance fixes to the database

echo ""
echo "================================"
echo "FVU 9.3 Compliance Database Setup"
echo "================================"
echo ""

# Database credentials (modify these or use environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"
DB_NAME="${DB_NAME:-tds_pro_db}"

# Step 1: Add address_change_flag column
echo "Step 1: Adding address_change_flag column..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/add_address_change_flag.sql
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to add address_change_flag column"
    exit 1
fi
echo "✓ Column added successfully"

echo ""
echo "Step 2: Running FVU 9.3 compliance setup..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/fvu_9_3_compliance_setup.sql
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to run compliance setup"
    exit 1
fi
echo "✓ Compliance setup completed"

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Restart the Node.js server: npm start"
echo "2. Open the Deductor form and set Address Change Flag"
echo "3. Generate a TDS file"
echo "4. Validate against FVU 9.3"
echo ""
