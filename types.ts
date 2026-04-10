
export enum EntityType {
  Individual = 'Individual',
  Company = 'Company',
  Partnership = 'Partnership',
  Government = 'Government'
}

export interface ReturnContext {
  id?: string; // Return ID for file generation
  deductorId: string;
  financialYear: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  formNo: '24Q' | '26Q' | '27Q' | '27EQ';
  formType: 'Salary' | 'TDS Non-Salary' | 'TCS';
  type: 'Regular' | 'Correction';
  previousTokenNumber?: string;
}

export interface TdsReturn {
  id: string;
  deductorId: string;
  financialYear: string;
  quarter: string;
  formNo: string;
  formType: string;
  status: 'Draft' | 'Generated';
  type: 'Regular' | 'Correction';
  updatedAt: string;
  previousTokenNumber?: string;
}

export interface Deductor {
  id: string;
  // Basic Info
  tan: string;
  pan: string;
  gstin?: string;
  name: string; // Company Name
  branch: string;
  type: EntityType;

  // Company Address Details
  flat?: string;
  building: string;
  road: string;
  area: string;
  city: string; // Town/District
  state: string;
  pincode: string;

  // Contact
  std?: string;
  phone: string;
  altStd?: string;
  altPhone?: string;
  email: string;
  altEmail?: string;

  // Responsible Person
  responsiblePerson: string; // Name
  responsibleDesignation: string;
  responsibleFatherName?: string;
  responsibleMobile?: string;
  responsiblePan?: string;

  // Responsible Person Address
  rpFlat?: string;
  rpBuilding: string;
  rpRoad: string;
  rpArea: string;
  rpCity?: string;
  rpState?: string;
  rpPincode?: string;
  rpStd?: string;
  rpPhone: string;
  rpAltStd?: string;
  rpAltPhone?: string;
  rpEmail?: string;
  rpAltEmail?: string;

  // Government Deductors
  govPaoCode?: string;
  govPaoRegNo?: string;
  govDdoCode?: string;
  govDdoRegNo?: string;
  govState?: string;
  govMinistry?: string;
  govOtherMinistry?: string;
  govAin?: string;

  // FVU 9.3 Required Flags
  deductorCode?: 'D' | 'C'; // Deductor (D) or Collector (C)
  addressChangeFlag?: 'Y' | 'N'; // Address changed since last return (BH record position 38)

  itPassword?: string; // Income Tax Portal Password
  address?: string; // Kept for backward compatibility but optional
}

export interface Challan {
  id: string;
  deductorId: string;
  bsrCode: string; // [408]
  date: string; // [410] YYYY-MM-DD
  serialNo: string; // [409]

  // Amounts
  tds: number; // [402]
  surcharge: number;
  educationCess: number;
  interest: number; // [403]
  fee: number; // [404]
  others: number; // [405]
  total: number; // [406] - Total Deposit (Calculated)

  minorHead: '200' | '400'; // [411]

  // Allocated (Internal use for consumption tracking)
  interestAllocated: number;
  othersAllocated: number;

  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  financialYear: string;
  status?: 'Draft' | 'Generated';
}

export interface Deductee {
  id: string;
  deductorId: string;
  name: string;
  pan: string;
  code: '01' | '02'; // 01: Company, 02: Non-Company
  deducteeStatus?: 'O' | 'A'; // O: Ordinary, A: Alternate
  buyerSellerFlag?: '1' | '2'; // 1: Buyer, 2: Seller
  email?: string;
  mobile?: string;
  address?: string;
}

export interface DeductionEntry {
  id: string;
  deductorId: string;
  challanId: string; // Link to challan
  deducteeId: string; // Link to deductee

  // Form Fields
  section: string; // [417]
  paymentDate: string; // [418] Date of payment/credit
  deductedDate: string; // [422] Date of deduction

  amountOfPayment: number; // [419]
  rate: number; // [423]

  // Tax Breakdown [422]
  incomeTax: number;
  surcharge: number;
  cess: number;
  totalTax: number; // IncomeTax + Surcharge + Cess

  taxDeposited: number; // [420] Usually same as totalTax
  status?: 'Draft' | 'Generated';

  remarks: string; // [425] Reason for lower deduction etc.
  certificateNo?: string; // [425] If lower deduction
}

// Updated TDS Sections with separate rates for Individual/Other vs Company
export interface TdsSection {
  code: string;
  description: string;
  rateIndividual: number; // For Individual/HUF (Code 02)
  rateCompany: number; // For Company (Code 01)
}

export const TDS_SECTIONS: TdsSection[] = [
  { code: '192', description: 'Salary', rateIndividual: 0, rateCompany: 0 },
  { code: '192A', description: 'Payment of accumulated balance due to an employee', rateIndividual: 10, rateCompany: 10 },
  { code: '193', description: 'Interest on securities', rateIndividual: 10, rateCompany: 10 },
  { code: '194', description: 'Dividend', rateIndividual: 10, rateCompany: 10 },
  { code: '194A', description: 'Interest other than "Interest on securities"', rateIndividual: 10, rateCompany: 10 },
  { code: '194B', description: 'Winnings from lottery or crossword puzzle', rateIndividual: 30, rateCompany: 30 },
  { code: '194BA', description: 'Winnings from online games', rateIndividual: 30, rateCompany: 30 },
  { code: '194BB', description: 'Winnings from horse race', rateIndividual: 30, rateCompany: 30 },
  { code: '194C', description: 'Payments to Contractors', rateIndividual: 1, rateCompany: 2 },
  { code: '194D', description: 'Insurance Commission', rateIndividual: 5, rateCompany: 10 },
  { code: '194DA', description: 'Life insurance policy payment', rateIndividual: 2, rateCompany: 2 }, // Budget 2024 Reduced to 2%
  { code: '194EE', description: 'Payments in respect of deposits under NSS', rateIndividual: 10, rateCompany: 10 },
  { code: '194F', description: 'Repurchase of units by MF or UTI', rateIndividual: 20, rateCompany: 20 },
  { code: '194G', description: 'Commission on sale of lottery tickets', rateIndividual: 2, rateCompany: 2 }, // Budget 2024 Reduced to 2%
  { code: '194H', description: 'Commission or brokerage', rateIndividual: 2, rateCompany: 2 }, // Budget 2024 Reduced to 2%
  { code: '194I(a)', description: 'Rent for plant and machinery', rateIndividual: 2, rateCompany: 2 },
  { code: '194I(b)', description: 'Rent for land, building or furniture', rateIndividual: 10, rateCompany: 10 },
  { code: '194IA', description: 'Transfer of immovable property (excl. agri land)', rateIndividual: 1, rateCompany: 1 },
  { code: '194IB', description: 'Rent by Individual/HUF (>50k)', rateIndividual: 5, rateCompany: 5 },
  { code: '194J(a)', description: 'Fees for professional services', rateIndividual: 10, rateCompany: 10 },
  { code: '194J(b)', description: 'Fees for technical services / Call Center', rateIndividual: 2, rateCompany: 2 },
  { code: '194K', description: 'Income in respect of units of mutual fund', rateIndividual: 10, rateCompany: 10 },
  { code: '194LA', description: 'Compensation on acquisition of immovable property', rateIndividual: 10, rateCompany: 10 },
  { code: '194M', description: 'Commission, brokerage, prof. fee by Ind/HUF', rateIndividual: 2, rateCompany: 2 }, // Budget 2024 Reduced to 2%
  { code: '194O', description: 'E-commerce operator payments', rateIndividual: 0.1, rateCompany: 0.1 }, // Budget 2024 Reduced to 0.1%
  { code: '194Q', description: 'Payment for purchase of goods', rateIndividual: 0.1, rateCompany: 0.1 },
  { code: '194R', description: 'Benefit or perquisite in respect of business', rateIndividual: 10, rateCompany: 10 },
  { code: '194S', description: 'Transfer of virtual digital asset', rateIndividual: 1, rateCompany: 1 },
];

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

export const STATE_CODES: { [key: string]: string } = {
  "Andhra Pradesh": "28", "Arunachal Pradesh": "12", "Assam": "18", "Bihar": "10", "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24",
  "Haryana": "06", "Himachal Pradesh": "02", "Jharkhand": "20", "Karnataka": "29", "Kerala": "32", "Madhya Pradesh": "23", "Maharashtra": "27",
  "Manipur": "14", "Meghalaya": "17", "Mizoram": "15", "Nagaland": "13", "Odisha": "21", "Punjab": "03", "Rajasthan": "08", "Sikkim": "11",
  "Tamil Nadu": "33", "Telangana": "36", "Tripura": "16", "Uttar Pradesh": "31", "Uttarakhand": "05", "West Bengal": "19", "Delhi": "07"
};

export const MINISTRIES = [
  "Agriculture", "Atomic Energy", "Chemicals and Fertilizers", "Civil Aviation", "Coal", "Commerce and Industry",
  "Communications", "Consumer Affairs", "Corporate Affairs", "Culture", "Defense", "Earth Sciences", "Education",
  "Electronics and Information Technology", "Environment, Forest and Climate Change", "External Affairs", "Finance",
  "Fisheries, Animal Husbandry and Dairying", "Food Processing Industries", "Health and Family Welfare",
  "Heavy Industries", "Home Affairs", "Housing and Urban Affairs", "Information and Broadcasting", "Jal Shakti",
  "Labour and Employment", "Law and Justice", "Micro, Small and Medium Enterprises", "Mines", "Minority Affairs",
  "New and Renewable Energy", "Panchayati Raj", "Parliamentary Affairs", "Personnel, Public Grievances and Pensions",
  "Petroleum and Natural Gas", "Planning", "Ports, Shipping and Waterways", "Power", "Railways", "Road Transport and Highways",
  "Rural Development", "Science and Technology", "Skill Development and Entrepreneurship", "Social Justice and Empowerment",
  "Space", "Statistics and Programme Implementation", "Steel", "Textiles", "Tourism", "Tribal Affairs", "Women and Child Development",
  "Youth Affairs and Sports", "Other"
];

export const REMARKS_OPTIONS = [
  "Normal",
  "A - Lower Deduction u/s 197",
  "B - No Deduction u/s 197A",
  "C - Higher Rate u/s 206AA",
  "T - Transporter (No TDS)",
  "Y - No Deduction (Threshold)",
  "Z - Software Acquired"
];

export const FINANCIAL_YEARS = [
  "2025-26", "2024-25", "2023-24", "2022-23"
];

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
export const FORMS = ["24Q", "26Q", "27Q", "27EQ"];

// --- User & Admin Types ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'practitioner';
  status: 'active' | 'banned';
  plan: 'basic' | 'pro' | 'enterprise';
  lastLogin: string;
  location: string;
  joinedAt: string;
}

export interface PlanLimits {
  businessLimit: number; // -1 = Unlimited
  adFree: boolean;
  adCount: number; // Number of ads to show if not ad-free
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  status: 'active' | 'inactive';
  limits: PlanLimits;
}

export interface AdConfig {
  headerScript: string;
  footerScript: string;
  enabled: boolean;
}

// --- News & Support Types ---

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'update' | 'maintenance';
  priority: 'normal' | 'high';
  date: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  type: 'bug' | 'error' | 'help' | 'other';
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  date: string;
  resolution?: string; // For admin to add resolution notes
}

// Token formatting utility for 15-digit Receipt Reference Number
export function formatTokenTo15Digits(token: string | undefined | null): string {
  if (!token) return '000000000000000'; // 15 zeros for empty token

  // Remove all non-digit characters
  const digits = String(token).replace(/\D/g, '');

  if (digits.length === 0) {
    return '000000000000000'; // 15 zeros if no digits
  }

  if (digits.length > 15) {
    return digits.substring(0, 15); // Truncate to 15
  }

  // Pad with leading zeros to reach exactly 15 digits
  return digits.padStart(15, '0');
}
