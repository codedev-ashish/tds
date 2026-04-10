## DEPLOYMENT INSTRUCTIONS - FVU 9.3 Error Fixes

**Target:** Fix T-FV-2084 and T_FV_6381 validation errors  
**Date:** 2026-01-28  
**Effort:** ~5 minutes

---

## Step 1: Backup Your Database (IMPORTANT!)
```bash
mysqldump -u root -p tds_pro_db > tds_pro_db_backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Step 2: Apply Database Migration

### Option A: Windows
```bash
cd f:\tds-pro-assistant
setup_fvu_93_windows.bat
```

### Option B: Linux/Mac
```bash
cd /path/to/tds-pro-assistant
bash setup_fvu_93.sh
```

### Option C: Manual (If scripts don't work)
```bash
# Terminal 1: Open MySQL
mysql -u root -p tds_pro_db

# Terminal 1: Run migration
source database/add_address_change_flag.sql;
source database/fvu_9_3_compliance_setup.sql;
exit;
```

---

## Step 3: Restart Server
```bash
# If running in terminal, stop with: Ctrl+C
# Then restart:
npm start

# OR if using npm run dev:
npm run dev
```

---

## Step 4: Test the Fix

### 4.1: Open Deductor Form
- Go to **Masters** → **Deductors**
- Click **Edit** on existing deductor (or create new)
- Scroll down to find **"FVU 9.3 Compliance Flags"** section

### 4.2: Set Address Change Flag
- Select: **"Y - Address Changed"** (or "N - No Change")
- Click **Save**

### 4.3: Generate TDS File
- Go to **Returns** tab
- Find your return entry
- Click **Generate** or access: `/api/returns/{returnId}/txt`
- Download the .txt file

### 4.4: Verify the File

**Check Line 2 (BH record):**
```bash
# Extract line 2 and check field count
head -2 file.txt | tail -1 | tr '^' '\n' | wc -l
# Should show: 73 (72 fields + line number)

# Check position 38 (Address Change Indicator)
head -2 file.txt | tail -1 | cut -d'^' -f38
# Should show: Y or N (not blank)
```

**Check Lines 4, 6, 8 (DD records):**
```bash
# Count DD records
grep "^[0-9]*^DD" file.txt | wc -l
# Should show: number of deductions

# View first DD record
head -4 file.txt | tail -1
# Should show: ^DD^...^PAN^^^NAME^...
```

### 4.5: Run FVU 9.3 Validator
```bash
# Navigate to validator location
cd "C:\Users\DELL\Downloads\TDS_STANDALONE_FVU_9.3"

# Drag and drop your .txt file OR:
# Run validator GUI and import the file
```

**Expected Results:**
- ✅ NO ERROR: T-FV-2084
- ✅ NO ERROR: T_FV_6381
- ✅ All other validations pass

---

## Troubleshooting

### Error: "ALTER TABLE" syntax error
**Cause:** Column might already exist  
**Solution:** Check database - column should exist after migration
```bash
mysql -u root -p tds_pro_db
DESCRIBE deductors;
```
Look for `address_change_flag` in output

### Error: Database connection refused
**Cause:** MySQL not running  
**Solution:**
```bash
# Windows
net start MySQL80  # or your MySQL version

# Linux
sudo systemctl start mysql

# Mac
brew services start mysql
```

### Still getting T-FV-2084 error
**Check 1:** Is column in database?
```sql
SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='deductors' AND COLUMN_NAME='address_change_flag';
# Should return: 1
```

**Check 2:** Is deductor record updated?
```sql
SELECT address_change_flag FROM deductors LIMIT 1;
# Should return: Y or N (not NULL)
```

**Check 3:** Did you restart server?
```bash
# Stop: Ctrl+C in terminal
# Start: npm start
```

### Still getting T_FV_6381 error
**Check 1:** Does file have DD records?
```bash
grep "^[0-9]*^DD" file.txt
# Should show at least one line
```

**Check 2:** Are deductions in database?
```sql
SELECT COUNT(*) FROM deduction_entries WHERE challan_id='YOUR_CHALLAN_ID';
# Should return: >= 1
```

**Check 3:** Are deductees linked?
```sql
SELECT deductee_id FROM deduction_entries WHERE challan_id='YOUR_CHALLAN_ID';
# Should return: Valid deductee IDs (not NULL)
```

---

## Rollback (If Needed)

If something goes wrong, restore from backup:
```bash
# Restore database
mysql -u root -p tds_pro_db < tds_pro_db_backup_YYYYMMDD_HHMMSS.sql

# Restart server
npm start
```

---

## Files Changed (Summary)

- ✅ `database/schema.sql` - Added address_change_flag column
- ✅ `services/tds_generator.js` - Dynamic BH field + DD record generation
- ✅ `routes/api.js` - API field mapping
- ✅ `components/Masters.tsx` - UI form field
- ✅ `types.ts` - Type definitions
- ✅ `database/add_address_change_flag.sql` - Migration file
- ✅ `database/fvu_9_3_compliance_setup.sql` - Compliance setup
- ✅ `database/INIT_DB_FVU_93.sql` - Fresh database init

---

## Verification Command

After deployment, run this to verify everything is working:

```bash
# Check database column
mysql -u root -p tds_pro_db -e "DESCRIBE deductors;" | grep address_change_flag

# Expected: address_change_flag | enum('Y','N') | YES | | N | |
```

---

## Support

**Documentation:**
- Full Details: [FVU_ERROR_FIXES_COMPLETE.md](FVU_ERROR_FIXES_COMPLETE.md)
- Quick Reference: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- Separator Guide: [SEPARATOR_IMPLEMENTATION_COMPLETE.md](SEPARATOR_IMPLEMENTATION_COMPLETE.md)

**Database Files:**
- Migration: [database/add_address_change_flag.sql](database/add_address_change_flag.sql)
- Setup: [database/fvu_9_3_compliance_setup.sql](database/fvu_9_3_compliance_setup.sql)
- Fresh Init: [database/INIT_DB_FVU_93.sql](database/INIT_DB_FVU_93.sql)

---

## Estimated Timeline

- Backup: 2 minutes
- Migration: 1 minute
- Server restart: 1 minute
- Testing: 5 minutes
- **Total: ~10 minutes**

---

## Final Checklist Before Validation

- [ ] Database migrated successfully
- [ ] Server restarted
- [ ] Deductor form shows new FVU 9.3 section
- [ ] Address Change Flag saves and displays
- [ ] .txt file generated without errors
- [ ] Line 2: Position 38 shows Y or N
- [ ] Lines 4, 6, 8: DD records present
- [ ] FVU validator confirms no errors

---

**Status:** ✅ READY TO DEPLOY  
**Contact:** [Support details if applicable]  
**Date:** 2026-01-28
