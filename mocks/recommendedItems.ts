import { ApplianceCategory } from '@/types';

export interface RecommendedItem {
  id: string;
  name: string;
  category: ApplianceCategory;
  location: string;
  isCustom?: boolean;
}

export interface RecommendedGroup {
  key: string;
  label: string;
  icon: string;
  color: string;
  items: RecommendedItem[];
}

export const GROUP_META: Record<string, { label: string; icon: string; color: string }> = {
  kitchen: { label: 'Kitchen', icon: 'kitchen', color: '#C4826D' },
  laundry: { label: 'Laundry', icon: 'laundry', color: '#A08670' },
  hvac: { label: 'Heating & Cooling', icon: 'hvac', color: '#5A8A60' },
  plumbing: { label: 'Plumbing', icon: 'plumbing', color: '#7BABC4' },
  electrical: { label: 'Electrical', icon: 'electrical', color: '#C9943A' },
  outdoor: { label: 'Outdoor', icon: 'outdoor', color: '#6B8F71' },
  garage: { label: 'Garage', icon: 'garage', color: '#7A7D8E' },
  pool: { label: 'Pool', icon: 'pool', color: '#4DA8C4' },
  roofing: { label: 'Roof & Exterior', icon: 'roofing', color: '#8B7355' },
  other: { label: 'Other', icon: 'other', color: '#AEA69D' },
};

export const recommendedGroups: RecommendedGroup[] = [
  {
    key: 'kitchen',
    label: 'Kitchen',
    icon: 'kitchen',
    color: '#C4826D',
    items: [
      { id: 'rec-k1', name: 'Refrigerator', category: 'kitchen', location: 'Kitchen' },
      { id: 'rec-k2', name: 'Oven / Range', category: 'kitchen', location: 'Kitchen' },
      { id: 'rec-k3', name: 'Dishwasher', category: 'kitchen', location: 'Kitchen' },
      { id: 'rec-k4', name: 'Microwave', category: 'kitchen', location: 'Kitchen' },
      { id: 'rec-k5', name: 'Garbage Disposal', category: 'kitchen', location: 'Kitchen' },
      { id: 'rec-k6', name: 'Range Hood', category: 'kitchen', location: 'Kitchen' },
      { id: 'rec-k7', name: 'Freezer', category: 'kitchen', location: 'Kitchen' },
      { id: 'rec-k8', name: 'Wine Cooler', category: 'kitchen', location: 'Kitchen' },
    ],
  },
  {
    key: 'laundry',
    label: 'Laundry',
    icon: 'laundry',
    color: '#A08670',
    items: [
      { id: 'rec-l1', name: 'Washing Machine', category: 'laundry', location: 'Laundry Room' },
      { id: 'rec-l2', name: 'Dryer', category: 'laundry', location: 'Laundry Room' },
    ],
  },
  {
    key: 'hvac',
    label: 'Heating & Cooling',
    icon: 'hvac',
    color: '#5A8A60',
    items: [
      { id: 'rec-h1', name: 'Central AC Unit', category: 'hvac', location: 'Exterior' },
      { id: 'rec-h2', name: 'Furnace', category: 'hvac', location: 'Basement' },
      { id: 'rec-h3', name: 'Thermostat', category: 'hvac', location: 'Hallway' },
      { id: 'rec-h4', name: 'Air Handler', category: 'hvac', location: 'Utility Room' },
      { id: 'rec-h5', name: 'Humidifier', category: 'hvac', location: 'Utility Room' },
      { id: 'rec-h6', name: 'Dehumidifier', category: 'hvac', location: 'Basement' },
      { id: 'rec-h7', name: 'Ceiling Fans', category: 'hvac', location: 'Throughout Home' },
    ],
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    icon: 'plumbing',
    color: '#7BABC4',
    items: [
      { id: 'rec-p1', name: 'Water Heater', category: 'plumbing', location: 'Garage' },
      { id: 'rec-p2', name: 'Sump Pump', category: 'plumbing', location: 'Basement' },
      { id: 'rec-p3', name: 'Water Softener', category: 'plumbing', location: 'Utility Room' },
      { id: 'rec-p4', name: 'Water Filtration System', category: 'plumbing', location: 'Kitchen' },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    icon: 'electrical',
    color: '#C9943A',
    items: [
      { id: 'rec-e1', name: 'Electrical Panel', category: 'electrical', location: 'Garage' },
      { id: 'rec-e2', name: 'Generator', category: 'electrical', location: 'Exterior' },
      { id: 'rec-e3', name: 'Smoke Detectors', category: 'electrical', location: 'Throughout Home' },
      { id: 'rec-e4', name: 'CO Detector', category: 'electrical', location: 'Hallway' },
      { id: 'rec-e5', name: 'Doorbell Camera', category: 'electrical', location: 'Front Door' },
      { id: 'rec-e6', name: 'Security System', category: 'electrical', location: 'Throughout Home' },
      { id: 'rec-e7', name: 'EV Charger', category: 'electrical', location: 'Garage' },
    ],
  },
  {
    key: 'outdoor',
    label: 'Outdoor',
    icon: 'outdoor',
    color: '#6B8F71',
    items: [
      { id: 'rec-od1', name: 'Lawn Mower', category: 'outdoor', location: 'Garage' },
      { id: 'rec-od2', name: 'Sprinkler System', category: 'outdoor', location: 'Yard' },
      { id: 'rec-od3', name: 'Outdoor Lighting', category: 'outdoor', location: 'Exterior' },
      { id: 'rec-od4', name: 'Patio Heater', category: 'outdoor', location: 'Patio' },
      { id: 'rec-od5', name: 'Grill / BBQ', category: 'outdoor', location: 'Patio' },
      { id: 'rec-od6', name: 'Fence', category: 'outdoor', location: 'Yard' },
      { id: 'rec-od7', name: 'Deck / Patio', category: 'outdoor', location: 'Backyard' },
      { id: 'rec-od8', name: 'Pressure Washer', category: 'outdoor', location: 'Garage' },
      { id: 'rec-od9', name: 'Leaf Blower', category: 'outdoor', location: 'Garage' },
    ],
  },
  {
    key: 'garage',
    label: 'Garage',
    icon: 'garage',
    color: '#7A7D8E',
    items: [
      { id: 'rec-g1', name: 'Garage Door Opener', category: 'garage', location: 'Garage' },
      { id: 'rec-g2', name: 'Garage Heater', category: 'garage', location: 'Garage' },
    ],
  },
  {
    key: 'pool',
    label: 'Pool',
    icon: 'pool',
    color: '#4DA8C4',
    items: [
      { id: 'rec-pl1', name: 'Pool Heater', category: 'pool', location: 'Exterior' },
      { id: 'rec-pl2', name: 'Pool Pump', category: 'pool', location: 'Exterior' },
      { id: 'rec-pl3', name: 'Pool Filter', category: 'pool', location: 'Exterior' },
      { id: 'rec-pl4', name: 'Pool Cleaner', category: 'pool', location: 'Exterior' },
      { id: 'rec-pl5', name: 'Pool Cover', category: 'pool', location: 'Pool Area' },
      { id: 'rec-pl6', name: 'Pool Lighting', category: 'pool', location: 'Pool Area' },
      { id: 'rec-pl7', name: 'Salt Chlorinator', category: 'pool', location: 'Exterior' },
    ],
  },
  {
    key: 'roofing',
    label: 'Roof & Exterior',
    icon: 'roofing',
    color: '#8B7355',
    items: [
      { id: 'rec-r1', name: 'Roof', category: 'roofing', location: 'Exterior' },
      { id: 'rec-r2', name: 'Gutters', category: 'roofing', location: 'Exterior' },
      { id: 'rec-r3', name: 'Siding', category: 'roofing', location: 'Exterior' },
      { id: 'rec-r4', name: 'Windows', category: 'roofing', location: 'Throughout Home' },
      { id: 'rec-r5', name: 'Exterior Paint', category: 'roofing', location: 'Exterior' },
    ],
  },
];
