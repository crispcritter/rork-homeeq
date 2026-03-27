import {
  HomeType,
  FoundationType,
  RoofType,
  HeatingCoolingType,
  WaterHeaterType,
  GarageType,
} from '@/types';

export const HOME_TYPE_OPTIONS: { value: HomeType; label: string }[] = [
  { value: 'single-family', label: 'Single Family' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'mobile-home', label: 'Mobile Home' },
  { value: 'other', label: 'Other' },
];

export const FOUNDATION_OPTIONS: { value: FoundationType; label: string }[] = [
  { value: 'slab', label: 'Slab' },
  { value: 'basement', label: 'Basement' },
  { value: 'crawlspace', label: 'Crawlspace' },
  { value: 'pier-and-beam', label: 'Pier & Beam' },
  { value: 'other', label: 'Other' },
];

export const ROOF_OPTIONS: { value: RoofType; label: string }[] = [
  { value: 'asphalt-shingle', label: 'Asphalt Shingle' },
  { value: 'metal', label: 'Metal' },
  { value: 'tile', label: 'Tile' },
  { value: 'slate', label: 'Slate' },
  { value: 'flat', label: 'Flat' },
  { value: 'wood-shake', label: 'Wood Shake' },
  { value: 'other', label: 'Other' },
];

export const HVAC_OPTIONS: { value: HeatingCoolingType; label: string }[] = [
  { value: 'central-ac', label: 'Central A/C' },
  { value: 'heat-pump', label: 'Heat Pump' },
  { value: 'window-units', label: 'Window Units' },
  { value: 'radiant', label: 'Radiant' },
  { value: 'forced-air', label: 'Forced Air' },
  { value: 'other', label: 'Other' },
];

export const WATER_HEATER_OPTIONS: { value: WaterHeaterType; label: string }[] = [
  { value: 'tank-gas', label: 'Tank (Gas)' },
  { value: 'tank-electric', label: 'Tank (Electric)' },
  { value: 'tankless-gas', label: 'Tankless (Gas)' },
  { value: 'tankless-electric', label: 'Tankless (Electric)' },
  { value: 'heat-pump', label: 'Heat Pump' },
  { value: 'other', label: 'Other' },
];

export const GARAGE_OPTIONS: { value: GarageType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'attached-1', label: 'Attached (1 car)' },
  { value: 'attached-2', label: 'Attached (2 car)' },
  { value: 'attached-3', label: 'Attached (3 car)' },
  { value: 'detached-1', label: 'Detached (1 car)' },
  { value: 'detached-2', label: 'Detached (2 car)' },
  { value: 'other', label: 'Other' },
];

export function getPickerLabel(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
