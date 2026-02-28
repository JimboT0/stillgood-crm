import { Timestamp } from "firebase/firestore";

export interface User {
  uid(file: File, arg1: ("pnp_franchise" | "pnp_corporate" | "spar_franchise" | "spar_corporate" | "independent" | "other")[], arg2: string[], docName: string, arg4: string | null, uid: any): unknown;
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "salesperson" | "operations" | "media" | "Magos";
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
  "Garden Route",
] as const;

export const BAG_PROVINCES = [
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
  "Garden Route",
] as const;

export type province = (typeof PROVINCES)[number];


export const storeTypes = [
  { value: "picknpay_franchise", label: "PicknPay Franchise", prefix: "PF" },
  { value: "spar_franchise", label: "Spar Franchise", prefix: "SF" },
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

// Onboarding Checklist Interface
export interface OnboardingChecklist {
  // 1. Store Information
  crmListingConfirmed?: boolean;
  storeWhatsappGroupSetup?: boolean;
  
  // 2. Store Management & Key Contacts - Names/numbers are already in contactPersons
  
  // 3. Operational Staff – Bag Loading Team - Names/numbers handled in contactPersons
  
  // 4. Training Preparation (Pre-Launch)
  allStaffAvailableForTraining?: boolean;
  bagLoadingTrainingMaterial?: boolean;
  collectionProcessVideo?: boolean;
  websiteSystemWalkthrough?: boolean;
  
  // 5. Day of Launch – Training Confirmation
  introducedToStoreManager?: boolean;
  allRelevantStaffPresent?: boolean;
  wasteRemovalProcessTrained?: boolean;
  wasteRecordingTrained?: boolean;
  correctBagPackingTrained?: boolean;
  staffUnderstandingConfirmed?: boolean;
  
  // Collection Process
  collectionTimesDiscussed?: boolean;
  customerCollectionProceduresExplained?: boolean;
  
  // 6. System & Website Training
  retailerTrainedOnWebsite?: boolean;
  storeLoginCreated?: boolean;
  loadBagsLinkConfirmed?: boolean;
  
  // 7. Operational Setup
  categoriesActive?: {
    produce?: boolean;
    bakery?: boolean;
    grocery?: boolean;
  };
  flexMessagingSetup?: boolean;
  flexMessageDetails?: string;
  bagsTapeStickersOrdered?: boolean;
  
  // 8. Training Completion
  trainingFullyCompleted?: boolean;
  followUpRequired?: boolean;
  followUpNotes?: string;
  
  // 9. Ops Team Sign-Off
  opsTeamMemberName?: string;
  opsSignOffDate?: Date;
  additionalNotes?: string;
}

// lib/firebase/types.ts
export interface Document {
  id: string;
  name: string;
  description: string | null; // New field for document description
  size: number;
  type: "pnp_franchise" | "pnp_corporate" | "spar_franchise" | "spar_corporate" | "independent" | "other" | "bank" | "sla";
  subcategory: string | null;
  storeId: string;
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
  newleaddetails?: NewLeadDetails[];
  tradingName?: string;
  streetAddress?: string;
  province?: string;
  status?: "new" | "lead" | "cold" | "warm" | "closed" | "pending setup" | "rollout" | "completed";
  salespersonId?: string;
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
  pushedToRolloutAt?: Timestamp | null;
  pushedToRolloutBy?: string;
  hasErrors?: boolean;
  retrainingRequired?: boolean;
  errors: Error[];
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
  createdAt?: Date;
  updatedAt?: Date;
  whatsappGroupLink?: string;
  onboardingChecklist?: OnboardingChecklist;
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

export interface Error {
  id: string;
  urgency: 1 | 2 | 3 | 4 | 5;
  issueDescription: string;
  issueType: "expired & spoiled" | "unexpired & spoiled" | "incorrect category" | "undervalue" | "damaged" | "invalid" | string;
  issueTime: Date;
  staffProcedure: "Packing" | "Collection" | "Wasting" | "Other"
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

export interface Rollout {
    id: string
    province: string
    area: string
    startDate?: Timestamp
    endDate?: Timestamp
    stores: Store[]
}

export type StoreOpsView = Omit<
  Store,
  | "groupId"
>;

export interface Comment {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  reportType: string; // e.g., "store_changes", "regional_report"
  reportId?: string; // Optional reference to specific report
}
