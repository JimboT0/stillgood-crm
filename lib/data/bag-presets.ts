// src/data/valueBags.ts
import type { Product } from "@/lib/firebase/types"

export const bagPresets: Record<'pnp' | 'spar' | 'standard', Product[]> = {
  pnp: [
    {
      name: 'Bakery',
      description: 'Assorted fresh bakery items including breads, rolls, and pastries, bundled for value.',
      retailPrice: 49.99,
      estimatedValue: 99.99,
    },
    {
      name: 'Deli',
      description: 'Selection of deli meats, cheeses, and prepared foods, offering great value for quick meals.',
      retailPrice: 59.99,
      estimatedValue: 119.99,
    },
    {
      name: 'Produce',
      description: 'Fresh fruits and vegetables bundled together for everyday value and nutrition.',
      retailPrice: 39.99,
      estimatedValue: 79.99,
    },
  ],
  spar: [
    {
      name: 'Bakery',
      description: 'Variety of baked goods like bread, muffins, and cakes, packed for convenience and savings.',
      retailPrice: 45.00,
      estimatedValue: 90.00,
    },
    {
      name: 'Deli',
      description: 'Assorted deli products including cold cuts, salads, and cheeses for easy meal prep.',
      retailPrice: 55.00,
      estimatedValue: 110.00,
    },
    {
      name: 'Produce',
      description: 'Seasonal fruits and veggies combined into a value pack for healthy eating.',
      retailPrice: 35.00,
      estimatedValue: 70.00,
    },
  ],
  standard: [
    {
      name: 'Bakery',
      description: 'Standard assortment of bakery essentials, perfect for independent store value offerings.',
      retailPrice: 40.00,
      estimatedValue: 80.00,
    },
    {
      name: 'Deli',
      description: 'Basic deli items bundled for affordability and variety in independent setups.',
      retailPrice: 50.00,
      estimatedValue: 100.00,
    },
    {
      name: 'Produce',
      description: 'Everyday produce items grouped for standard value in smaller or independent stores.',
      retailPrice: 30.00,
      estimatedValue: 60.00,
    },
  ],
};