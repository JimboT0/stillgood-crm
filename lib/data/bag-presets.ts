interface BagPreset {
  name: string
  description: string
  estimatedValue: number
  price: number
}

interface BagPresets {
  pnp: BagPreset[]
  spar: BagPreset[]
  standard: BagPreset[]
}

export const bagPresets: BagPresets = {
  pnp: [
    {
      name: "Vegetable - value bag",
      description: "A mix of fruit and vegetables",
      estimatedValue: 60,
      price: 29,
    },
    {
      name: "Bakery - value bag",
      description: "A selection of bakery and confectionery items",
      estimatedValue: 60,
      price: 29,
    },
    {
      name: "Convenience - value bag",
      description: "Includes hot foods, sandwiches, pizzas, etc.",
      estimatedValue: 60,
      price: 29,
    },
    {
      name: "Mystery - value bag",
      description: "A mixed selection from various categories",
      estimatedValue: 60,
      price: 29,
    },
    {
      name: "Mixedgrocery - value bag",
      description: "Cereals, canned goods, household items, etc.",
      estimatedValue: 60,
      price: 29,
    },
  ],
  spar: [
    {
      name: "Vegetable - value bag",
      description: "A mix of fruit and vegetables",
      estimatedValue: 50,
      price: 25,
    },
    {
      name: "Bakery - value bag",
      description: "A selection of bakery and confectionery items",
      estimatedValue: 50,
      price: 25,
    },
    {
      name: "Convenience - value bag",
      description: "Includes hot foods, sandwiches, pizzas, etc.",
      estimatedValue: 50,
      price: 25,
    },
    {
      name: "Mystery - value bag",
      description: "A mixed selection from various categories",
      estimatedValue: 50,
      price: 25,
    },
    {
      name: "Mixedgrocery - value bag",
      description: "Cereals, canned goods, household items, etc.",
      estimatedValue: 50,
      price: 25,
    },
  ],
  standard: [
    {
      name: "Vegetable - value bag",
      description: "A mix of fruit and vegetables",
      estimatedValue: 45,
      price: 22,
    },
    {
      name: "Bakery - value bag",
      description: "A selection of bakery and confectionery items",
      estimatedValue: 45,
      price: 22,
    },
    {
      name: "Convenience - value bag",
      description: "Includes hot foods, sandwiches, pizzas, etc.",
      estimatedValue: 45,
      price: 22,
    },
    {
      name: "Mystery - value bag",
      description: "A mixed selection from various categories",
      estimatedValue: 45,
      price: 22,
    },
    {
      name: "Mixedgrocery - value bag",
      description: "Cereals, canned goods, household items, etc.",
      estimatedValue: 45,
      price: 22,
    },
  ],
}
