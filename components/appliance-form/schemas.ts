import { z } from 'zod';

export const applianceSchema = z.object({
  name: z.string().describe('The name/type of the appliance, e.g. "Dishwasher", "Central AC Unit", "Washing Machine"'),
  brand: z.string().describe('The brand/manufacturer name, e.g. "Samsung", "LG", "Carrier"'),
  model: z.string().describe('The model number if visible'),
  serialNumber: z.string().describe('The serial number if visible'),
  category: z.enum(['hvac', 'plumbing', 'electrical', 'kitchen', 'laundry', 'outdoor', 'garage', 'pool', 'roofing', 'other']).describe('The category that best fits this appliance'),
  location: z.string().describe('Best guess for where this appliance is typically located, e.g. "Kitchen", "Basement", "Laundry Room"'),
  notes: z.string().describe('Any additional relevant details about the appliance visible in the image. Do NOT guess purchase date.'),
});

export const labelReadSchema = z.object({
  serialNumber: z.string().describe('The serial number exactly as printed on the label. Return empty string if not found.'),
  model: z.string().describe('The model number exactly as printed on the label. Return empty string if not found.'),
  brand: z.string().describe('The brand/manufacturer name exactly as printed on the label. Return empty string if not found.'),
  otherText: z.string().describe('Any other useful text visible on the label such as voltage, capacity, BTU, wattage, etc.'),
});

export const lookupSchema = z.object({
  name: z.string().describe('The common name of this appliance, e.g. "French Door Refrigerator", "Gas Furnace", "Front Load Washer". Be specific.'),
  brand: z.string().describe('The confirmed or corrected brand/manufacturer name'),
  model: z.string().describe('The confirmed or corrected model number'),
  serialNumber: z.string().describe('The serial number as provided'),
  category: z.enum(['hvac', 'plumbing', 'electrical', 'kitchen', 'laundry', 'outdoor', 'garage', 'pool', 'roofing', 'other']).describe('The category that best fits this appliance'),
  notes: z.string().describe('Useful specs or details about this appliance model (capacity, BTU, energy rating, etc). Do NOT guess purchase date or location.'),
});

export const receiptSchema = z.object({
  price: z.number().describe('The total price or amount paid for the item. Return 0 if not found.'),
  retailer: z.string().describe('The store or retailer name where the purchase was made. Return empty string if not found.'),
  purchaseDate: z.string().describe('The purchase date in YYYY-MM-DD format. Return empty string if not found.'),
  paymentMethod: z.string().describe('The payment method used (e.g. Visa ending 1234, Cash, etc). Return empty string if not found.'),
  orderNumber: z.string().describe('The order number, transaction number, or receipt number. Return empty string if not found.'),
  itemName: z.string().describe('The name of the appliance or item purchased, if identifiable. Return empty string if not found.'),
  warrantyInfo: z.string().describe('Any warranty information mentioned on the receipt. Return empty string if not found.'),
});
