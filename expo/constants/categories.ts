import { ColorScheme } from '@/constants/colors';

export const CATEGORY_AVATARS: Record<string, string> = {
  hvac: '#5A8A60',
  plumbing: '#7BABC4',
  electrical: '#C9943A',
  kitchen: '#C4826D',
  laundry: '#A08670',
  outdoor: '#6B8F71',
  garage: '#7A7D8E',
  pool: '#4DA8C4',
  roofing: '#8B7355',
  other: '#AEA69D',
};

export function getBudgetCategoryColors(c: ColorScheme): Record<string, string> {
  return {
    maintenance: c.categoryMaintenance,
    repair: c.categoryRepair,
    upgrade: c.categoryUpgrade,
    emergency: c.categoryEmergency,
    inspection: c.categoryInspection,
  };
}

export const categoryLabels: Record<string, string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  kitchen: 'Kitchen',
  laundry: 'Laundry',
  outdoor: 'Outdoor',
  garage: 'Garage',
  pool: 'Pool',
  roofing: 'Roofing',
  other: 'Other',
  maintenance: 'Maintenance',
  repair: 'Repair',
  upgrade: 'Upgrade',
  emergency: 'Emergency',
  inspection: 'Inspection',
};
