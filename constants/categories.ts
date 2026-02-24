import Colors from '@/constants/colors';

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

export const BUDGET_CATEGORY_COLORS: Record<string, string> = {
  maintenance: Colors.categoryMaintenance,
  repair: Colors.categoryRepair,
  upgrade: Colors.categoryUpgrade,
  emergency: Colors.categoryEmergency,
  inspection: Colors.categoryInspection,
};

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
