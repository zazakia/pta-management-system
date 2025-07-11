// Payment categories for income tracking
export const PAYMENT_CATEGORIES = {
  membership: {
    label: 'PTA Membership',
    description: 'Annual PTA membership dues',
    defaultAmount: 250,
    color: 'blue'
  },
  fundraising: {
    label: 'Fundraising',
    description: 'Fundraising events and activities',
    defaultAmount: 0,
    color: 'green'
  },
  donation: {
    label: 'Donations',
    description: 'General donations to the PTA',
    defaultAmount: 0,
    color: 'purple'
  },
  event: {
    label: 'Event Fees',
    description: 'School event participation fees',
    defaultAmount: 100,
    color: 'orange'
  },
  supplies: {
    label: 'School Supplies',
    description: 'Contribution for school supplies',
    defaultAmount: 150,
    color: 'red'
  },
  uniform: {
    label: 'Uniform Fees',
    description: 'School uniform payments',
    defaultAmount: 500,
    color: 'indigo'
  },
  other: {
    label: 'Other Income',
    description: 'Other miscellaneous income',
    defaultAmount: 0,
    color: 'gray'
  }
} as const;

export type PaymentCategory = keyof typeof PAYMENT_CATEGORIES;

export const PAYMENT_CATEGORY_OPTIONS = Object.entries(PAYMENT_CATEGORIES).map(
  ([value, config]) => ({
    value,
    label: config.label,
    description: config.description,
    defaultAmount: config.defaultAmount,
    color: config.color
  })
);

// Helper function to get category config
export function getCategoryConfig(category: PaymentCategory) {
  return PAYMENT_CATEGORIES[category];
}

// Helper function to get category color class
export function getCategoryColorClass(category: PaymentCategory) {
  const color = PAYMENT_CATEGORIES[category].color;
  return {
    bg: `bg-${color}-100`,
    text: `text-${color}-800`,
    border: `border-${color}-200`
  };
}