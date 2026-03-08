export type ISODateString = string & { readonly __brand: 'ISODate' };

export function toISODateString(date: Date): ISODateString {
  return date.toISOString().split('T')[0] as ISODateString;
}

export function toISOTimestamp(date: Date): ISODateString {
  return date.toISOString() as ISODateString;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/;

export function asISODateString(value: string): ISODateString {
  if (value === '') return value as ISODateString;
  if (!ISO_DATE_RE.test(value)) {
    console.warn(`asISODateString: invalid format "${value}", returning empty string`);
    return '' as ISODateString;
  }
  return value as ISODateString;
}

export type Rating = number & { readonly __brand: 'Rating' };

export function toRating(value: number): Rating {
  const clamped = Math.round(Math.max(0, Math.min(5, value)) * 10) / 10;
  return clamped as Rating;
}

export function isValidRating(value: number): boolean {
  return !isNaN(value) && value >= 0 && value <= 5;
}

export function intervalToDays(interval: number, unit: RecurringUnit): number {
  switch (unit) {
    case 'days':
      return interval;
    case 'weeks':
      return interval * 7;
    case 'months':
      return interval * 30;
    case 'years':
      return interval * 365;
  }
}

export function formatRecurringLabel(interval: number, unit: RecurringUnit): string {
  const label = unit === 'days' ? 'day' : unit === 'weeks' ? 'week' : unit === 'months' ? 'month' : 'year';
  return `Every ${interval} ${interval === 1 ? label : label + 's'}`;
}

export function daysToNaturalUnit(days: number): { interval: number; unit: RecurringUnit } {
  if (days >= 365 && days % 365 === 0) return { interval: days / 365, unit: 'years' };
  if (days >= 30 && days % 30 === 0) return { interval: days / 30, unit: 'months' };
  if (days >= 7 && days % 7 === 0) return { interval: days / 7, unit: 'weeks' };
  return { interval: days, unit: 'days' };
}

export type ApplianceCategory =
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'kitchen'
  | 'laundry'
  | 'outdoor'
  | 'garage'
  | 'pool'
  | 'roofing'
  | 'other';

export type TaskPriority = 'low' | 'medium' | 'high';
export type RecurringUnit = 'days' | 'weeks' | 'months' | 'years';
export type TaskStatus = 'upcoming' | 'overdue' | 'completed' | 'archived';
export type BudgetCategory = 'maintenance' | 'repair' | 'upgrade' | 'emergency' | 'inspection';
export type BudgetItemType = 'expense' | 'credit';

export interface PurchaseData {
  price?: number;
  retailer?: string;
  purchaseDate?: ISODateString;
  receiptImageUrl?: string;
  paymentMethod?: string;
  orderNumber?: string;
}

export interface AppliancePhoto {
  id: string;
  uri: string;
  isPrimary: boolean;
}

export interface ManualInfo {
  type: 'upload' | 'link';
  uri: string;
  title?: string;
  foundVia?: 'user' | 'search';
}

export interface AppInfo {
  appStoreUrl?: string;
  appName?: string;
  username?: string;
  password?: string;
}

export interface Appliance {
  id: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  category: ApplianceCategory;
  purchaseDate: ISODateString;
  warrantyExpiry: ISODateString;
  imageUrl?: string;
  photos?: AppliancePhoto[];
  notes: string;
  location: string;
  purchaseData?: PurchaseData;
  manual?: ManualInfo;
  hasWarranty?: boolean;
  appInfo?: AppInfo;
}

export interface MaintenanceTask {
  id: string;
  applianceId?: string;
  title: string;
  description: string;
  dueDate: ISODateString;
  completedDate?: ISODateString;
  priority: TaskPriority;
  status: TaskStatus;
  recurring: boolean;
  recurringInterval?: number;
  recurringUnit?: RecurringUnit;
  estimatedCost?: number;
  notes?: string[];
  archivedDate?: ISODateString;
  productLink?: string;
  trustedProId?: string;
  calendarEventId?: string;
  reminderEventId?: string;
}

export interface ExpenseProvider {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  specialty?: string;
  notes?: string;
}

export interface BudgetItem {
  id: string;
  type: BudgetItemType;
  category: BudgetCategory;
  description: string;
  amount: number;
  date: ISODateString;
  applianceId?: string;
  receiptImages?: string[];
  provider?: ExpenseProvider;
  paymentMethod?: string;
  invoiceNumber?: string;
  notes?: string;
  taxDeductible?: boolean;
}

export function signedAmount(item: BudgetItem): number {
  return item.type === 'credit' ? -item.amount : item.amount;
}

export type HomeType = 'single-family' | 'townhouse' | 'condo' | 'apartment' | 'duplex' | 'mobile-home' | 'other';
export type FoundationType = 'slab' | 'basement' | 'crawlspace' | 'pier-and-beam' | 'other';
export type HeatingCoolingType = 'central-ac' | 'heat-pump' | 'window-units' | 'radiant' | 'forced-air' | 'other';
export type GarageType = 'none' | 'attached-1' | 'attached-2' | 'attached-3' | 'detached-1' | 'detached-2' | 'other';
export type RoofType = 'asphalt-shingle' | 'metal' | 'tile' | 'slate' | 'flat' | 'wood-shake' | 'other';
export type WaterHeaterType = 'tank-gas' | 'tank-electric' | 'tankless-gas' | 'tankless-electric' | 'heat-pump' | 'other';

export interface HomeProfile {
  id: string;
  nickname: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  homeType: HomeType;
  yearBuilt: number | null;
  squareFootage: number | null;
  lotSize: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  stories: number | null;
  foundationType: FoundationType;
  roofType: RoofType;
  roofAge: number | null;
  heatingCoolingType: HeatingCoolingType;
  waterHeaterType: WaterHeaterType;
  garageType: GarageType;
  hasPool: boolean;
  hasHoa: boolean;
  hoaAmount: number | null;
  purchaseDate: ISODateString;
  notes: string;
  profileImage?: string;
  zillowLink?: string;
}

export interface ReviewRating {
  source: 'google' | 'yelp' | 'angies_list' | 'bbb' | 'homeadvisor' | 'thumbtack';
  rating: Rating;
  reviewCount?: number;
  url?: string;
}

export interface PrivateNote {
  id: string;
  text: string;
  createdAt: ISODateString;
}

export type ProServiceCategory = ApplianceCategory | 'general' | 'landscaping' | 'painting' | 'cleaning' | 'pest-control' | 'security';

export interface TrustedPro {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  notes?: string;
  expenseIds: string[];
  createdAt: ISODateString;
  ratings?: ReviewRating[];
  linkedApplianceIds?: string[];
  privateNotes?: PrivateNote[];
  serviceCategories?: ProServiceCategory[];
  serviceRadius?: number;
  licenseNumber?: string;
  insuranceVerified?: boolean;
}
