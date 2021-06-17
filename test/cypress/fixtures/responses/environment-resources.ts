export const envResources = {
  total: 5,
  sys: {
    type: 'Array',
  },
  items: [
    {
      name: 'Entry',
      usage: 30,
      limits: {
        included: 3000000,
        maximum: 3000000,
      },
      parent: {
        name: 'Record',
        usage: 34,
        limits: {
          included: 3000000,
          maximum: 3000000,
        },
        parent: null,
        kind: 'permanent',
        period: null,
        sys: {
          type: 'EnvironmentResource',
          id: 'record',
        },
        unitOfMeasure: null,
      },
      kind: 'permanent',
      period: null,
      sys: {
        type: 'EnvironmentResource',
        id: 'entry',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Asset',
      usage: 4,
      limits: {
        included: 3000000,
        maximum: 3000000,
      },
      parent: {
        name: 'Record',
        usage: 34,
        limits: {
          included: 3000000,
          maximum: 3000000,
        },
        parent: null,
        kind: 'permanent',
        period: null,
        sys: {
          type: 'EnvironmentResource',
          id: 'record',
        },
        unitOfMeasure: null,
      },
      kind: 'permanent',
      period: null,
      sys: {
        type: 'EnvironmentResource',
        id: 'asset',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Record',
      usage: 34,
      limits: {
        included: 3000000,
        maximum: 3000000,
      },
      parent: null,
      kind: 'permanent',
      period: null,
      sys: {
        type: 'EnvironmentResource',
        id: 'record',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Locale',
      usage: 1,
      limits: {
        included: 30,
        maximum: 30,
      },
      parent: null,
      kind: 'permanent',
      period: null,
      sys: {
        type: 'EnvironmentResource',
        id: 'locale',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Content type',
      usage: 0,
      limits: {
        included: 70,
        maximum: 70,
      },
      parent: null,
      kind: 'permanent',
      period: null,
      sys: {
        type: 'EnvironmentResource',
        id: 'content_type',
      },
      unitOfMeasure: null,
    },
  ],
};
