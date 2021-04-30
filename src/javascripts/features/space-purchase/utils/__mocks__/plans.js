/* eslint-disable import/no-unused-modules */
export const freeSpace = {
  sys: {
    type: 'ProductRatePlan',
    id: 'free',
  },
  name: 'Proof of Concept',
  price: 0,
  internalName: 'free_2018_03',
  productPlanType: 'free_space',
  productType: 'on_demand',
  productRatePlanCharges: [
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c796b016271671f40223c',
      },
      name: 'Space fee',
      model: 'FlatFee',
      uom: null,
      price: 0,
      tiers: null,
      chargeType: 'Recurring',
      unitType: 'charge',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c796b016271671fd42242',
      },
      name: 'Roles',
      model: 'PerUnit',
      uom: 'Role Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 0,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c796b0162716720752248',
      },
      name: 'Locales',
      model: 'PerUnit',
      uom: 'Locale Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 2,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c796b01627167210f224e',
      },
      name: 'Content types',
      model: 'PerUnit',
      uom: 'Content Type Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 24,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c796b0162716721ac2254',
      },
      name: 'Records',
      model: 'PerUnit',
      uom: 'Record Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 5000,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c796b016271672247225b',
      },
      name: 'Environments',
      model: 'PerUnit',
      uom: 'Environment Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 1,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
  ],
  roleSet: {
    id: 'default_v2',
    roles: [],
  },
  committed: false,
  customerType: 'Self-service',
  unavailabilityReasons: null,
};

export const unavailableFreeSpace = Object.assign({}, freeSpace, {
  unavailabilityReasons: [
    {
      type: 'freeSpacesMaximumLimitReached',
      maximumLimit: 2,
      usage: 2,
      additionalInfo: 'Free spaces',
    },
  ],
});

export const microSpace = {
  sys: {
    type: 'ProductRatePlan',
    id: '2c92c0f9626c87e00162716e36073e20',
  },
  name: 'Micro',
  price: 39,
  internalName: 'space_size_1',
  productPlanType: 'space',
  productType: 'on_demand',
  productRatePlanCharges: [
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e00162716e36443e22',
      },
      name: 'Space fee',
      model: 'FlatFee',
      uom: null,
      price: 39,
      tiers: null,
      chargeType: 'Recurring',
      unitType: 'charge',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e00162716e36763e28',
      },
      name: 'Roles',
      model: 'PerUnit',
      uom: 'Role Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 0,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e00162716e36a23e2e',
      },
      name: 'Locales',
      model: 'PerUnit',
      uom: 'Locale Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 2,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e00162716e36e03e35',
      },
      name: 'Content types',
      model: 'PerUnit',
      uom: 'Content Type Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 24,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e00162716e370d3e3b',
      },
      name: 'Records',
      model: 'PerUnit',
      uom: 'Record Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 5000,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e00162716e373b3e41',
      },
      name: 'Environments',
      model: 'PerUnit',
      uom: 'Environment Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 1,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
  ],
  roleSet: {
    id: 'default_v2',
    roles: [],
  },
  committed: false,
  customerType: 'Self-service',
  unavailabilityReasons: null,
};

export const smallSpace = {
  sys: {
    type: 'ProductRatePlan',
    id: '2c92c0f9626c87e201627170ab474502',
  },
  name: 'Small',
  price: 189,
  internalName: 'space_size_2',
  productPlanType: 'space',
  productType: 'on_demand',
  productRatePlanCharges: [
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e201627170aba0450c',
      },
      name: 'Roles',
      model: 'PerUnit',
      uom: 'Role Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 1,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e201627170abcf4512',
      },
      name: 'Locales',
      model: 'PerUnit',
      uom: 'Locale Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 4,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e201627170ac25451f',
      },
      name: 'Records',
      model: 'PerUnit',
      uom: 'Record Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 10000,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e201627170ac534525',
      },
      name: 'Environments',
      model: 'PerUnit',
      uom: 'Environment Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 2,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e201627170ab724505',
      },
      name: 'Space fee',
      model: 'FlatFee',
      uom: null,
      price: 189,
      tiers: null,
      chargeType: 'Recurring',
      unitType: 'charge',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f9626c87e201627170abf84519',
      },
      name: 'Content types',
      model: 'PerUnit',
      uom: 'Content Type Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 24,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
  ],
  roleSet: {
    id: 'basic_v2',
    roles: ['Editor'],
  },
  committed: false,
  customerType: 'Self-service',
  unavailabilityReasons: null,
};

export const mediumSpace = {
  sys: {
    type: 'ProductRatePlan',
    id: '2c92c0f8626c79640162717515231773',
  },
  name: 'Medium',
  price: 489,
  internalName: 'space_size_3',
  productPlanType: 'space',
  productType: 'on_demand',
  productRatePlanCharges: [
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79640162717515341775',
      },
      name: 'Space fee',
      model: 'FlatFee',
      uom: null,
      price: 489,
      tiers: null,
      chargeType: 'Recurring',
      unitType: 'charge',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c796401627175155d177b',
      },
      name: 'Roles',
      model: 'PerUnit',
      uom: 'Role Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 1,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79640162717515811781',
      },
      name: 'Locales',
      model: 'PerUnit',
      uom: 'Locale Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 7,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79640162717515a61787',
      },
      name: 'Content types',
      model: 'PerUnit',
      uom: 'Content Type Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 48,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79640162717515cd178d',
      },
      name: 'Records',
      model: 'PerUnit',
      uom: 'Record Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 25000,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79640162717515f41793',
      },
      name: 'Environments',
      model: 'PerUnit',
      uom: 'Environment Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 3,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
  ],
  roleSet: {
    id: 'basic_v2',
    roles: ['Editor'],
  },
  committed: false,
  customerType: 'Self-service',
  unavailabilityReasons: null,
};

export const mediumSpaceCurrent = Object.assign({}, mediumSpace, {
  unavailabilityReasons: [
    {
      type: 'currentPlan',
      maximumLimit: null,
      usage: null,
      additionalInfo: null,
    },
  ],
});

export const largeSpace = {
  sys: {
    type: 'ProductRatePlan',
    id: '2c92c0f8626c79cb016271768aa70683',
  },
  name: 'Large',
  price: 879,
  internalName: 'space_size_4',
  productPlanType: 'space',
  productType: 'on_demand',
  productRatePlanCharges: [
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79cb016271768acf0685',
      },
      name: 'Space fee',
      model: 'FlatFee',
      uom: null,
      price: 879,
      tiers: null,
      chargeType: 'Recurring',
      unitType: 'charge',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79cb016271768af2068b',
      },
      name: 'Roles',
      model: 'PerUnit',
      uom: 'Role Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 12,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79cb016271768b160691',
      },
      name: 'Locales',
      model: 'PerUnit',
      uom: 'Locale Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 10,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79cb016271768b390697',
      },
      name: 'Content types',
      model: 'PerUnit',
      uom: 'Content Type Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 48,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79cb016271768b5b069d',
      },
      name: 'Records',
      model: 'PerUnit',
      uom: 'Record Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 50000,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
    {
      sys: {
        type: 'ProductRatePlanCharge',
        id: '2c92c0f8626c79cb016271768b7f06a3',
      },
      name: 'Environments',
      model: 'PerUnit',
      uom: 'Environment Limit',
      price: 0,
      tiers: [
        {
          tier: 1,
          price: 0,
          startingUnit: 0,
          endingUnit: 5,
          priceFormat: 'FlatFee',
        },
      ],
      chargeType: 'Recurring',
      unitType: 'limit',
    },
  ],
  roleSet: {
    id: 'collaboration_v2',
    roles: [
      'Editor',
      'Author',
      'Translator 1',
      'Translator 2',
      'Translator 3',
      'Translator 4',
      'Translator 5',
      'Translator 6',
      'Translator 7',
      'Translator 8',
      'Translator 9',
      'Translator 10',
    ],
  },
  committed: false,
  customerType: 'Self-service',
  unavailabilityReasons: null,
};
