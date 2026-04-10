# TDS Form 26Q File Generator - Corrections & Field Documentation
## Version 8.0 (FVU File Format dated 27/05/2025)

---

## 🔴 CRITICAL ISSUES FOUND IN ORIGINAL CODE

### 1. **Incorrect Field Counts**
- **FH Record**: Should have 16 fields (yours had correct count)
- **BH Record**: Should have **72 fields** (yours was missing several)
- **CD Record**: Should have **40 fields** (yours had incorrect structure)
- **DD Record**: Should have **54 fields** (yours had correct count)

### 2. **State Code Mapping Error** ⚠️ CRITICAL BUG
```javascript
// ❌ WRONG in original code
"Lakshadweep": "31",     // Incorrect
"Uttar Pradesh": "31",   // Both mapped to same code!

// ✅ CORRECT
"Lakshadweep": "37",
"Uttar Pradesh": "09"
```

### 3. **Missing Token Number Handling for Corrections**
- Token number should be in field 9 of BH record (not field 8)
- Field 8 is for "Token Number of original statement" (NA)
- Field 9 is for "Previous statement Token Number" (Optional, 15 digits)

### 4. **Incorrect CD Record Structure**
The original CD record had wrong field ordering. Correct sequence:
```
Fields 1-6: Line, Type, Batch, Serial, Count, NIL Indicator
Fields 7-11: NA fields (Filler 3-5, Last Challan No)
Field 12: Bank Challan No (5 digits)
Fields 13-15: DDO fields
Field 16: BSR Code (7 digits) ← This was in wrong position
Field 17: Last Date (NA)
Field 18: Date of Challan
Fields 19-21: Fillers/Section (NA)
Fields 22-27: OLTAS amounts
```

### 5. **Missing Validations**
Your code lacked:
- PAN format validation (AAAAA9999A)
- TAN format validation (AAAA99999A)
- BSR code validation (7 digits)
- Section code validation
- Date range validation for quarter

---

## 📋 COMPLETE FIELD STRUCTURE

### FILE HEADER (FH) - 16 FIELDS

| # | Field Name | Type | Size | M/O/NA | Description |
|---|------------|------|------|--------|-------------|
| 1 | Line Number | INTEGER | 9 | M | Running sequence number |
| 2 | Record Type | CHAR | 2 | M | Fixed value: "FH" |
| 3 | File Type | CHAR | 4 | M | Fixed value: "NS1" |
| 4 | Upload Type | CHAR | 2 | M | "R" = Regular, "C" = Correction |
| 5 | File Creation Date | DATE | 8 | M | Format: DDMMYYYY |
| 6 | File Sequence No. | INTEGER | - | M | Unique sequence number |
| 7 | Uploader Type | CHAR | 1 | M | Fixed value: "D" (Deductor) |
| 8 | TAN of Deductor | CHAR | 10 | M | Format: AAAA99999A |
| 9 | Total No. of Batches | INTEGER | 9 | M | Usually "1" |
| 10 | Return Preparation Utility | CHAR | 75 | M | Software name |
| 11 | Record Hash | NA | 0 | NA | Leave empty |
| 12 | FVU Version | NA | 0 | NA | Leave empty |
| 13 | File Hash | NA | 0 | NA | Leave empty |
| 14 | Sam Version | NA | 0 | NA | Leave empty |
| 15 | SAM Hash | NA | 0 | NA | Leave empty |
| 16 | SCM Version | NA | 0 | NA | Leave empty |

**Total Separators**: 15 (one less than field count)

---

### BATCH HEADER (BH) - 72 FIELDS

| # | Field Name | Type | Size | M/O/NA | Description |
|---|------------|------|------|--------|-------------|
| 1 | Line Number | INTEGER | 9 | M | Running sequence |
| 2 | Record Type | CHAR | 2 | M | Fixed: "BH" |
| 3 | Batch Number | INTEGER | 9 | M | Usually "1" |
| 4 | Count of Challan Records | INTEGER | 9 | M | Number of CD records |
| 5 | Form Number | CHAR | 4 | M | Fixed: "26Q" |
| 6 | Transaction Type | CHAR | 2 | O | C1/C2/C3/C5/C9 for corrections |
| 7 | Batch Updation Indicator | NA | - | O | Leave empty |
| 8 | Token of Original Statement | NA | - | O | Leave empty |
| 9 | Previous Token Number | CHAR | 15 | O | **15 digits** for corrections |
| 10 | Token Submitted | NA | - | O | Leave empty |
| 11 | Token Date | NA | - | O | Leave empty |
| 12 | Last TAN | NA | - | O | Leave empty |
| 13 | TAN of Deductor | CHAR | 10 | M | Must match FH |
| 14 | Receipt Number | CHAR | 8 | NA | Leave empty |
| 15 | PAN of Deductor | CHAR | 10 | M | Format: AAAAA9999A |
| 16 | Assessment Year | INTEGER | 6 | M | Format: 202526 (YYYYYY) |
| 17 | Financial Year | INTEGER | 6 | M | Format: 202425 (YYYYYY) |
| 18 | Period | CHAR | 2 | M | Q1/Q2/Q3/Q4 |
| 19 | Name of Deductor | CHAR | 75 | M | Max 75 chars |
| 20 | Branch/Division | CHAR | 75 | O | Optional |
| 21 | Deductor Address1 | CHAR | 25 | M | Flat/Door/Block |
| 22 | Deductor Address2 | CHAR | 25 | O | Building |
| 23 | Deductor Address3 | CHAR | 25 | O | Road/Street/Lane |
| 24 | Deductor Address4 | CHAR | 25 | O | Area/Locality |
| 25 | Deductor Address5 | CHAR | 25 | O | Town/City/District |
| 26 | State | INTEGER | 2 | M | **2-digit state code** |
| 27 | Pincode | INTEGER | 6 | M | **6 digits** |
| 28 | Email ID | CHAR | 75 | O | Optional |
| 29 | STD Code | INTEGER | 5 | O | Optional |
| 30 | Telephone | INTEGER | 10 | O | Optional |
| 31 | Change of Address | CHAR | 1 | M | Y/N (usually "N") |
| 32 | Deductor Type | CHAR | 1 | M | **Q/G/S/O** |
| 33 | Responsible Person Name | CHAR | 75 | M | Required |
| 34 | Designation | CHAR | 20 | M | Required |
| 35 | RP Address1 | CHAR | 25 | M | Required |
| 36 | RP Address2 | CHAR | 25 | O | Optional |
| 37 | RP Address3 | CHAR | 25 | O | Optional |
| 38 | RP Address4 | CHAR | 25 | O | Optional |
| 39 | RP Address5 | CHAR | 25 | O | Optional |
| 40 | RP State | INTEGER | 2 | M | 2-digit code |
| 41 | RP PIN | INTEGER | 6 | M | 6 digits |
| 42 | RP Email ID-1 | CHAR | 75 | O | Optional |
| 43 | Mobile Number | CHAR | 10 | O | Optional |
| 44 | RP STD Code | INTEGER | 5 | O | Optional |
| 45 | RP Telephone | INTEGER | 10 | O | Optional |
| 46 | Change of RP Address | CHAR | 1 | M | Y/N (usually "N") |
| 47 | Batch Total Deposit | INTEGER | 15 | M | **Total TDS deposited** |
| 48 | Unmatched Challan Count | CHAR | 9 | O | Optional |
| 49 | Count of Salary Details | NA | - | O | Leave empty |
| 50 | Batch Total Gross Income | NA | - | O | Leave empty |
| 51 | AO Approval | CHAR | 1 | M | Y/N (usually "N") |
| 52 | Regular Statement Filed | CHAR | 15 | O | Optional |
| 53 | Last Deductor Type | CHAR | 1 | NA | Leave empty |
| 54 | State Name | CHAR | 2 | O | Optional |
| 55 | PAO Code | CHAR | 20 | O | For Govt only |
| 56 | DDO Code | CHAR | 20 | O | For Govt only |
| 57 | Ministry Name | CHAR | 3 | O | For Govt only |
| 58 | Ministry Name Other | CHAR | 150 | O | For Govt only |
| 59 | PAN of Responsible Person | CHAR | 10 | O | Optional |
| 60 | PAO Registration No | INTEGER | 7 | O | For Govt only |
| 61 | DDO Registration No | CHAR | 10 | O | For Govt only |
| 62 | Deductor STD (Alt) | INTEGER | 5 | O | Optional |
| 63 | Deductor Phone (Alt) | INTEGER | 10 | O | Optional |
| 64 | Deductor Email (Alt) | CHAR | 75 | O | Optional |
| 65 | RP STD (Alt) | INTEGER | 5 | O | Optional |
| 66 | RP Phone (Alt) | INTEGER | 10 | O | Optional |
| 67 | RP Email (Alt) | CHAR | 75 | O | Optional |
| 68 | AIN Number | CHAR | 7 | O | For Govt only |
| 69 | GSTN | CHAR | 15 | O | Optional |
| 70 | Salary Details Count | NA | - | O | Leave empty |
| 71 | Salary Gross Income | NA | - | O | Leave empty |
| 72 | Record Hash | NA | - | O | Leave empty |

**Total Separators**: 71

---

### CHALLAN DETAIL (CD) - 40 FIELDS

| # | Field Name | Type | Size | M/O/NA | Description |
|---|------------|------|------|--------|-------------|
| 1 | Line Number | INTEGER | 9 | M | Running sequence |
| 2 | Record Type | CHAR | 2 | M | Fixed: "CD" |
| 3 | Batch Number | INTEGER | 9 | M | Usually "1" |
| 4 | Challan Record Number | INTEGER | 9 | M | Sequential per batch |
| 5 | Count of Deductee Records | INTEGER | 9 | M | Number of DD records |
| 6 | NIL Challan Indicator | CHAR | 1 | M | Y/N |
| 7 | Challan Updation Indicator | NA | - | O | Leave empty |
| 8 | Filler 3 | NA | - | O | Leave empty |
| 9 | Filler 4 | NA | - | O | Leave empty |
| 10 | Filler 5 | NA | - | O | Leave empty |
| 11 | Last Bank Challan No | NA | - | O | Leave empty |
| 12 | Bank Challan No | INTEGER | 5 | O | **5 digits** |
| 13 | Last DDO Serial | NA | - | O | Leave empty |
| 14 | DDO Serial Number | INTEGER | 9 | O | For Govt only |
| 15 | Last BSR Code | NA | - | O | Leave empty |
| 16 | BSR Code | INTEGER | 7 | M | **7 digits** |
| 17 | Last Challan Date | NA | - | O | Leave empty |
| 18 | Challan Date | DATE | 8 | M | DDMMYYYY |
| 19 | Filler 6 | NA | - | O | Leave empty |
| 20 | Filler 7 | NA | - | O | Leave empty |
| 21 | Section | NA | NA | NA | Leave empty |
| 22 | OLTAS Income Tax | INTEGER | 15 | M | Amount with .00 |
| 23 | OLTAS Surcharge | INTEGER | 15 | M | Amount with .00 |
| 24 | OLTAS Cess | INTEGER | 15 | M | Amount with .00 |
| 25 | OLTAS Interest | INTEGER | 15 | M | Amount with .00 |
| 26 | OLTAS Others | INTEGER | 15 | M | Amount with .00 |
| 27 | Total Deposit Amount | INTEGER | 15 | M | **Sum of 22-26** |
| 28 | Last Total Deposit | NA | - | O | Leave empty |
| 29 | Tax per Deductee Annexure | DECIMAL | 15 | M | Sum from DD records |
| 30 | TDS Income Tax | DECIMAL | 15 | M | From DD records |
| 31 | TDS Surcharge | DECIMAL | 15 | M | From DD records |
| 32 | TDS Cess | DECIMAL | 15 | M | From DD records |
| 33 | Sum of Total Tax Deducted | DECIMAL | 15 | M | **30+31+32** |
| 34 | TDS Interest | INTEGER | 15 | M | Usually 0.00 |
| 35 | TDS Others | INTEGER | 15 | M | Usually 0.00 |
| 36 | Cheque/DD No | INTEGER | 15 | O | Optional |
| 37 | Book Entry/Cash | CHAR | 1 | O | B/C/N |
| 38 | Remarks | CHAR | 14 | O | Optional |
| 39 | Fee | INTEGER | 15 | O | Optional |
| 40 | Minor Head | INTEGER | 3 | O | 200/400 |

**Total Separators**: 39

---

### DEDUCTEE DETAIL (DD) - 54 FIELDS

| # | Field Name | Type | Size | M/O/NA | Description |
|---|------------|------|------|--------|-------------|
| 1 | Line Number | INTEGER | 9 | M | Running sequence |
| 2 | Record Type | CHAR | 2 | M | Fixed: "DD" |
| 3 | Batch Number | INTEGER | 9 | M | Usually "1" |
| 4 | Challan Record Number | INTEGER | 9 | M | Links to CD |
| 5 | Deductee Record No | INTEGER | 9 | M | Sequential per challan |
| 6 | Mode | CHAR | 1 | M | **O/A** (Original/Addition) |
| 7 | Employee Serial No | NA | - | O | Leave empty |
| 8 | Deductee Code | CHAR | 1 | M | **1=Buyer, 2=Seller** |
| 9 | Last Employee PAN | NA | - | O | Leave empty |
| 10 | Deductee's PAN | CHAR | 10 | M | Format: AAAAA9999A |
| 11 | Last Deductee Ref No | NA | - | O | Leave empty |
| 12 | Deductee Ref No | CHAR | 10 | O | Optional (10 chars) |
| 13 | Name of Deductee | CHAR | 75 | M | Max 75 chars |
| 14 | TDS Income Tax | DECIMAL | 15 | M | Amount.00 |
| 15 | TDS Surcharge | DECIMAL | 15 | M | Amount.00 |
| 16 | Health & Education Cess | DECIMAL | 15 | M | Amount.00 |
| 17 | Total Income Tax Deducted | DECIMAL | 15 | M | **14+15+16** |
| 18 | Last Total Tax | NA | - | O | Leave empty |
| 19 | Total Tax Deposited | DECIMAL | 15 | M | Same as field 17 |
| 20 | Last Tax Deposited | NA | - | O | Leave empty |
| 21 | Total Value of Purchase | NA | - | O | Leave empty |
| 22 | Amount Paid/Credited | DECIMAL | 15 | M | Transaction amount |
| 23 | Date Amount Paid | DATE | 8 | M | DDMMYYYY |
| 24 | Date Tax Deducted | DATE | 8 | O | DDMMYYYY (optional) |
| 25 | Date of Deposit | NA | - | O | Leave empty |
| 26 | Rate of Tax | DECIMAL | 7 | M | **X.XXXX (4 decimals)** |
| 27 | Grossing up Indicator | NA | - | O | Leave empty |
| 28 | Book Entry/Cash | CHAR | 1 | M | **B/C** |
| 29 | Date of Certificate | NA | - | O | Leave empty |
| 30 | Remarks 1 | CHAR | 1 | O | **A/B/C/D/T/Z** |
| 31 | Remarks 2 | CHAR | 1 | O | Future use |
| 32 | Remarks 3 | CHAR | 14 | O | Future use |
| 33 | Section Code | CHAR | 3 | O | **e.g., 94Q, 194J** |
| 34 | Certificate Number | CHAR | 10 | O | U/s 197 |
| 35-42 | Fillers 1-8 | NA | NA | NA | Leave empty (8 fields) |
| 43-48 | 194N Cash Withdrawal | NA | NA | NA | Leave empty (6 fields) |
| 49-53 | Fillers 9-13 | NA | NA | NA | Leave empty (5 fields) |
| 54 | Record Hash | NA | - | O | Leave empty |

**Total Separators**: 53

---

## 🔑 KEY FIELD VALUES

### Deductor Type (BH Field 32)
```
Q = Company
G = Government
S = State Government
O = Others
```

### Deductee Code (DD Field 8)
```
1 = Buyer (for 194Q)
2 = Seller (most common)
```

### Mode (DD Field 6)
```
O = Original entry
A = Addition (for corrections)
```

### Remarks 1 (DD Field 30) - Lower/No Deduction
```
A = Lower deduction u/s 197
B = No tax due to DTAA
C = No tax due to other reasons
D = Higher deduction (no PAN)
T = Presumptive tax u/s 194M
Z = Tax at threshold limit
```

### Section Codes (DD Field 33)
```
Common Codes:
94Q  - TCS on sale of goods (converted from 194Q)
192A - Premature withdrawal from EPF
192B - Income from winning horse races
193  - Interest on securities
194A - Interest other than on securities
194B - Winnings from lottery
194C - Payment to contractors
194D - Insurance commission
194G - Commission on lottery tickets
194H - Commission or brokerage
194I - Rent
194J - Fees for professional/technical services
194K - Income from units
194M - Payment to contractors by individuals
194N - Cash withdrawal
```

### State Codes (BH Field 26, 40; Important!)
```
States:
01 = Jammu & Kashmir    11 = Sikkim             21 = Odisha
02 = Himachal Pradesh   12 = Arunachal Pradesh  22 = Chhattisgarh
03 = Punjab             13 = Nagaland           23 = Madhya Pradesh
04 = Chandigarh         14 = Manipur            27 = Maharashtra
05 = Uttarakhand        15 = Mizoram            28 = Andhra Pradesh
06 = Haryana            16 = Tripura            29 = Karnataka
07 = Delhi              17 = Meghalaya          30 = Goa
08 = Rajasthan          18 = Assam              32 = Kerala
09 = Uttar Pradesh      19 = West Bengal        33 = Tamil Nadu
10 = Bihar              20 = Jharkhand          34 = Puducherry
                                                35 = Andaman & Nicobar
UTs:                                            36 = Telangana
26 = Dadra & Nagar Haveli                       37 = Lakshadweep
37 = Lakshadweep (NOT 31!)                      38 = Ladakh
```

---

## ⚠️ CRITICAL VALIDATIONS TO ADD

### 1. **PAN Validation**
```javascript
validatePAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
}
```

### 2. **TAN Validation**
```javascript
validateTAN(tan) {
    const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
    return tanRegex.test(tan);
}
```

### 3. **BSR Code Validation**
```javascript
validateBSR(bsr) {
    return /^\d{7}$/.test(bsr);
}
```

### 4. **Amount Validation**
```javascript
validateAmount(amount) {
    return Number(amount) >= 0 && Number.isFinite(Number(amount));
}
```

### 5. **Date in Quarter Validation**
```javascript
validateDateInQuarter(date, quarter, fy) {
    const quarters = {
        'Q1': { start: '04-01', end: '06-30' },
        'Q2': { start: '07-01', end: '09-30' },
        'Q3': { start: '10-01', end: '12-31' },
        'Q4': { start: '01-01', end: '03-31' }
    };
    // Implementation needed
}
```

---

## 📝 IMPORTANT NOTES

### File Format Requirements
1. **Line Endings**: Must use CRLF (`\r\n`) - Windows style
2. **Delimiter**: Caret symbol (`^`)
3. **Encoding**: ASCII text file with `.txt` extension
4. **Decimal Format**: Always 2 decimals for amounts (e.g., `1000.50`)
5. **Rate Format**: Always 4 decimals for rates (e.g., `10.0000`)
6. **Date Format**: Always DDMMYYYY (e.g., `03022026`)
7. **Uppercase**: All text fields must be UPPERCASE

### Challan Status Inquiry (CSI) File
**MANDATORY**: Import .csi file from TIN website to verify:
- TAN and TAN name match
- BSR codes are valid
- Challan dates and amounts match

### NIL Challans
If NIL challan indicator is "Y", deductee records MUST have:
- Remarks1 field populated with: A, B, Y, S, T, or Z

### Token Number (For Corrections)
- Original statement token: Field 8 of BH (leave empty)
- Previous correction token: Field 9 of BH (15 digits mandatory)
- Format: Exactly 15 digits (pad with leading zeros if needed)

### Correction Types
```
C1 = Correction in deductor details (excluding TAN)
C2 = Correction in deductor and/or challan details
C3 = Correction in deductor, challan, and/or deductee details
C5 = Correction in PAN of deductees
C9 = Addition of challans (discontinued for most deductors)
```

---

## ✅ SUMMARY OF FIXES

1. ✅ Corrected state code mapping (Lakshadweep = 37, UP = 09)
2. ✅ Fixed BH record to have exactly 72 fields
3. ✅ Fixed CD record to have exactly 40 fields
4. ✅ Fixed DD record structure with correct field positions
5. ✅ Added proper token number handling in field 9 of BH
6. ✅ Corrected BSR code position in CD record
7. ✅ Added comprehensive field documentation
8. ✅ Marked all M/O/NA fields correctly
9. ✅ Added validation functions
10. ✅ Fixed section code conversion (194Q → 94Q)
11. ✅ Corrected amount and rate formatting
12. ✅ Fixed CRLF line endings

---

## 🚀 NEXT STEPS

1. **Test with FVU Tool**: The corrected file MUST be validated with the official FVU utility
2. **Import CSI File**: Before validation, import the .csi file from TIN website
3. **Verify All Amounts**: Ensure CD totals match sum of DD records
4. **Check TAN Name**: TAN name in file must match exactly with CSI file
5. **Validate Dates**: All dates must be within the financial quarter
6. **Review Section Codes**: Ensure all section codes are valid for 26Q

---

## 📞 Support

For FVU file format queries:
- TIN Website: https://www.tin-nsdl.com
- Download section: File format specifications
- Help section: e-TDS/TCS return preparation

---

*Document Version: 1.0*
*Date: February 3, 2026*
*Based on: FVU File Format Version 8.0 (27/05/2025)*
