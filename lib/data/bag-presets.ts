// src/data/valueBags.ts
import type { Product } from "@/lib/firebase/types"

export const bagPresets: Record<'pnp' | 'spar' | 'standard', Product[]> = {
  pnp: [
    {
      name: 'Mystery - Value Bag',
      description: 'Get a fresh mix of both Fruit & Veg and Bakery items at a fraction of the price. You might find items like apples, muffins, potatoes, or pastries. Contents vary, but quality is still good. Images are for illustration only actual contents may vary.',
      retailPrice: 54.95,
      estimatedValue: 150.00,
    },
    {
      name: 'Fruit & Veg - Value Bag',
      description: 'Get a fresh mix of perfectly good fruit or vegetables at a fraction of the price. You might find items like apples, bananas, carrots, or potatoes. Contents vary, but quality is still good. Images are for illustration only actual contents may vary.',
      retailPrice: 54.95,
      estimatedValue: 150.00,
    },
        {
      name: 'Fruit & Veg - Value Bag',
      description: 'Enjoy a fresh selection of perfectly good bakery products at a fraction of the price. You might find bread rolls, muffins, or pastries—savoury, sweet, or both. Contents vary, but quality is still good. Images are for illustration only—actual contents may vary.',
      retailPrice: 38.45,
      estimatedValue: 100.00,
    },
  ],
  spar: [
    {
      name: 'Mystery - Value Bag',
      description: 'Get a fresh mix of both Fruit & Veg and Bakery items at a fraction of the price. You might find items like apples, muffins, potatoes, or pastries. Contents vary, but quality is still good. Images are for illustration only actual contents may vary.',
      retailPrice: 54.95,
      estimatedValue: 150.00,
    },
    {
      name: 'Fruit & Veg - Value Bag',
      description: 'Get a fresh mix of perfectly good fruit or vegetables at a fraction of the price. You might find items like apples, bananas, carrots, or potatoes. Contents vary, but quality is still good. Images are for illustration only actual contents may vary.',
      retailPrice: 54.95,
      estimatedValue: 150.00,
    },
        {
      name: 'Fruit & Veg - Value Bag',
      description: 'Enjoy a fresh selection of perfectly good bakery products at a fraction of the price. You might find bread rolls, muffins, or pastries—savoury, sweet, or both. Contents vary, but quality is still good. Images are for illustration only—actual contents may vary.',
      retailPrice: 38.45,
      estimatedValue: 100.00,
    },
  ],
  standard: [
    {
      name: 'Mystery - Value Bag',
      description: 'Get a fresh mix of both Fruit & Veg and Bakery items at a fraction of the price. You might find items like apples, muffins, potatoes, or pastries. Contents vary, but quality is still good. Images are for illustration only actual contents may vary.',
      retailPrice: 54.95,
      estimatedValue: 150.00,
    },
    {
      name: 'Fruit & Veg - Value Bag',
      description: 'Get a fresh mix of perfectly good fruit or vegetables at a fraction of the price. You might find items like apples, bananas, carrots, or potatoes. Contents vary, but quality is still good. Images are for illustration only actual contents may vary.',
      retailPrice: 54.95,
      estimatedValue: 150.00,
    },
        {
      name: 'Fruit & Veg - Value Bag',
      description: 'Enjoy a fresh selection of perfectly good bakery products at a fraction of the price. You might find bread rolls, muffins, or pastries—savoury, sweet, or both. Contents vary, but quality is still good. Images are for illustration only—actual contents may vary.',
      retailPrice: 38.45,
      estimatedValue: 100.00,
    },
  ],
};