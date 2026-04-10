# PDF Generation Feature - Form 27A

## Overview
PDF files are now automatically generated alongside .txt and .fvu files for TDS returns. Users can download Form 27A in PDF format from the "Saved/Filed Returns" section.

## Implementation Details

### 1. **PDF Generator Service** (`services/pdf_generator.js`)
- Uses `pdfkit` library for PDF generation
- Generates professional Form 27A documents with:
  - **Header Section**: Government of India, Form Number, Generated date
  - **Deductor Information**: Name, TAN, PAN, Type, Complete Address
  - **Challan & Deductee Details**: Tabular format showing:
    - Serial Number
    - Challan Date
    - Challan Number
    - TDS Amount
    - Surcharge
    - Total Amount
  - **Summary Section**: 
    - Total Challans
    - Total Deductees
    - Total Deductions
    - Total TDS, Surcharge, Cess
    - Total Tax Deposited
  - **Footer**: Certification, Authorized Signatory, Generation timestamp

### 2. **API Endpoint** (`routes/api.js`)
```
GET /api/returns/:id/pdf
```
- Triggers PDF generation on demand
- Saves PDF file to: `files/{deductor_name}/{fy}/{quarter}/return_{returnId}.pdf`
- Returns PDF for download
- Handles errors gracefully with error logging

### 3. **UI Component** (`components/Transactions.tsx`)
- Added `.pdf` button in SavedReturnsList table
- Located next to `.fvu` and `.txt` download buttons
- Click to generate and download PDF on-the-fly
- Same naming convention: `FVU_{formNo}_{returnId}.pdf`

## File Structure
```
TDS-Pro-Assistant/
├── services/
│   ├── tds_generator.js      (existing)
│   ├── pdf_generator.js       (NEW - PDF generation)
│   └── gemini.ts
├── routes/
│   └── api.js                 (updated with /pdf endpoint)
├── components/
│   └── Transactions.tsx       (updated with PDF button)
└── package.json              (updated with pdfkit)
```

## Installation & Dependencies
```bash
npm install pdfkit
```

The following dependencies are required:
- `pdfkit` - PDF document generation
- `fs` - File system operations
- `path` - File path utilities
- `mysql2` - Database queries

## Usage Flow

1. **User Creates and Generates a Return**
   - Fills in deductor, deductees, challans, and deductions
   - Generates return (status changes to "Generated")

2. **View Saved Returns**
   - Navigate to "Saved/Filed Returns" table
   - Three download options appear:
     - `.fvu` - FVU format file
     - `.txt` - Text format file
     - `.pdf` - Form 27A PDF document

3. **Download PDF**
   - Click `.pdf` button
   - PDF is generated on-demand with all return data
   - File is downloaded with standard naming: `FVU_[FormNo]_[ReturnID].pdf`
   - File is also saved to the file system for future reference

## Error Handling
- If PDF generation fails, error is logged to: `generatedfile/{returnId}_pdf_errors.log`
- Error details include:
  - Timestamp
  - Return ID & Deductor Info
  - Error message and stack trace
- User receives error response with guidance

## File Storage
Generated PDFs are stored at:
```
F:\tds-pro-assistant\files\{deductor_name}\{financial_year}\{quarter}\return_{id}.pdf
```

Example:
```
files/vinod_kumar_rai/2025_26/q1/return_97b00e39.pdf
```

## Form 27A PDF Layout

### Page 1 - Main Details
```
┌─────────────────────────────────────────┐
│      INCOME TAX DEPARTMENT              │
│      GOVERNMENT OF INDIA                │
│                                         │
│  Form No. [FormNo] | FVU 9.3 Format    │
│  Generated: [Date] | FY: [FY] | Q: [Q] │
└─────────────────────────────────────────┘

DEDUCTOR INFORMATION
├─ Name: [Name]
├─ TAN: [TAN]
├─ PAN: [PAN]
├─ Type: [Type]
└─ Address: [Full Address]

CHALLAN & DEDUCTEE DETAILS
┌─────┬──────────┬──────────┬────┬──────┬──────┐
│ S.No│ Date     │ Challan# │TDS │Surch.│Total │
├─────┼──────────┼──────────┼────┼──────┼──────┤
│ 1   │ [date]   │ [no]     │ X  │ Y    │ Z    │
│ 2   │ [date]   │ [no]     │ X  │ Y    │ Z    │
└─────┴──────────┴──────────┴────┴──────┴──────┘

SUMMARY
├─ Total Challans: [count]
├─ Total Deductees: [count]
├─ Total Deductions: [count]
├─ Total TDS: [amount]
├─ Total Surcharge: [amount]
├─ Total Cess: [amount]
└─ Total Tax Deposited: [amount]

CERTIFICATION
I hereby certify that the information furnished above is correct and complete.

_________________________
Authorized Signatory

Generated on: [DateTime]
Return ID: [ID]
FVU Format Version: 9.3
```

## Future Enhancements
- Multi-page support for large returns
- Custom header/logo from deductor branding
- Barcode for return ID
- Digital signature support
- Email PDF directly from application
- Batch PDF generation for multiple returns

## Testing
To test the PDF generation:
1. Create a complete TDS return with deductors and deductions
2. Generate the return (status → "Generated")
3. Go to "Saved/Filed Returns" section
4. Click the `.pdf` button
5. Verify PDF downloads with correct filename format
6. Check the file is saved in the files directory
7. Verify PDF contains all return data correctly formatted

## Notes
- PDFs are generated on-demand, not pre-generated
- Large returns may take a few seconds to generate
- PDFs include all data visible in the return at time of generation
- File naming follows the same convention as .fvu and .txt files
- Duplicate PDF requests will regenerate the file (overwriting previous)
