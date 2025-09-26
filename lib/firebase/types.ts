import { Timestamp } from "firebase/firestore";

export interface User {
  uid(file: File, arg1: ("pnp_franchise" | "pnp_corporate" | "spar_franchise" | "spar_corporate" | "independent" | "other")[], arg2: string[], docName: string, arg4: string | null, uid: any): unknown;
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "salesperson" | "operations" | "media";
  createdAt: Date;
  updatedAt: Date;
  assignedStores?: string[];
}

export const PROVINCES = [
  "_",
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type province = (typeof PROVINCES)[number];


export const storeTypes = [
  { value: "picknpay_franchise", label: "PicknPay Franchise", prefix: "PF" },
  { value: "picknpay_corporate", label: "PicknPay Corporate", prefix: "PC" },
  { value: "spar_franchise", label: "Spar Franchise", prefix: "SF" },
  { value: "spar_corporate", label: "Spar Corporate", prefix: "SC" },
  { value: "food_lovers_market", label: "Food Lovers Market", prefix: "FL" },
  { value: "independent", label: "Independent", prefix: "IN" },
] as const;

export interface ContactPerson {
  role: string;
  name: string;
  phone: string;
  email: string;
  designation: string;
  isPrimary: boolean;
}

export interface Product {
  name: string;
  description?: string;
  retailPrice?: number;
  estimatedValue?: number;
}

export interface CollectionTimes {
  mondayFriday: { from: string; to: string };
  saturday: { from: string; to: string };
  sunday: { from: string; to: string };
  publicHoliday: { from: string; to: string };
}

export interface ContractTerms {
  months?: number;
  notes?: string;
}

// lib/firebase/types.ts
export interface Document {
  id: string;
  name: string;
  description: string | null; // New field for document description
  size: number;
  type: "pnp_franchise" | "pnp_corporate" | "spar_franchise" | "spar_corporate" | "independent" | "other" | "bank" | "sla";
  subcategory: string | null;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}


export interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  packageType: string;
  createdBy: string;
  createdAt: Date;
}

export interface NewLeadDetails {
  id: string;
  type: "owner" | "supplier" | "other";
  launch: "soon" | "later";
  marketing: boolean;
}

export interface Store {
  id: string;
  newleaddetails: NewLeadDetails[];
  tradingName: string;
  streetAddress: string;
  province: string;
  status: "new" | "lead" | "cold" | "warm" | "closed" | "pending setup" | "rollout" | "completed";
  salespersonId: string;
  assignedUserId?: string;
  assignedOpsIds?: string[]; 
  isSetup?: boolean;
  setupConfirmed?: boolean;
  setupConfirmedBy?: string;
  setupConfirmedAt?: Date;
  isSocialSetup?: boolean;
  socialSetupConfirmed?: boolean;
  socialSetupConfirmedBy?: string;
  socialSetupConfirmedAt?: Date;
  trainingDate?: Timestamp | null;
  launchDate?: Timestamp | null;
  pushedToRollout?: boolean;
  pushedToRolloutAt?: Date;
  pushedToRolloutBy?: string;
  hasErrors?: boolean;
  errorDescription?: string;
  errorSetBy?: string;
  errorSetAt?: Date;
  slaDocument?: Document;
  bankDocument?: Document;
  signedSla?: boolean;
  bankConfirmation?: boolean;
  bankConfirmationEmail?: string;
  isKeyStore?: boolean;
  storeType?: string;
  storeId?: string;
  contactPersons?: ContactPerson[];
  products?: Product[];
  collectionTimes?: CollectionTimes;
  contractTerms?: ContractTerms;
  notes?: string;
  isKeyAccount?: boolean;
  keyAccountManager?: string;
  assignedOpsUsers?: string[];
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
  credentials?: Array<{
    username: string;
    password: string;
    orderusername: string;
    orderpassword: string;
    bagusername: string;
    bagpassword: string;
    createdAt: Date;
  }>;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Timestamp | null;
  province?: province;
  createdAt: Date;
  updatedAt: Date;
} 

export interface StoreGroup {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  contactPersons: Array<{
    name: string;
    email: string;
    phone: string;
    role: string;
  }>;
  keyAccountManager?: string;
  storeIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BagInventory {
  id: string;
  province: province;
  totalBags: number;
  lastUpdated: Date;
  updatedBy: string;
  updatedByName: string;
}

export interface BagLog {
  id: string;
  province: province;
  changeType: "addition" | "removal";
  bagsChanged: number;
  source?: string;
  destination?: string;
  sourceType?: "purchase" | "transfer" | "return" | "other";
  destinationType?: "store" | "other";
  storeId?: string;
  storeName?: string;
  notes?: string;
  createdAt: Date;
  removedBy: string;
  removedByName: string;
}

export type StoreOpsView = Omit<
  Store,
  | "assignedUserId"
  | "groupId"
>;


export interface Refunds {
  id: string
  userId: string
  email: string
  amount: number
  bank: string
  vat: boolean
  invoiceUrl?: string
  urgency: "low" | "medium" | "high"
  supplierName: string
  accountNumber: string
  type: "bag costs" | "printing" | "travel" | "consulting" | "marketing" | "stationery" | "entertainment" | "other"
  submittedAt: Date
  status: "pending" | "accepted" | "paid" | "declined"
}

