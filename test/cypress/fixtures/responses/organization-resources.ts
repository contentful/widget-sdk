export const orgResources = {
  total: 5,
  sys: {
    type: 'Array',
  },
  items: [
    {
      name: 'Free space',
      usage: 7,
      limits: {
        included: 100,
        maximum: 100,
      },
      period: null,
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'free_space',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Organization membership',
      usage: 3,
      limits: {
        included: 5,
        maximum: 5,
      },
      period: null,
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'organization_membership',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Pending invitation',
      usage: 0,
      limits: {
        included: null,
        maximum: null,
      },
      period: null,
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'pending_invitation',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Api request',
      usage: 40,
      limits: {
        included: 2000000,
        maximum: 2000000,
      },
      period: {
        start: '2020-06-25T00:00:00+00:00',
        end: '2020-07-24T00:00:00+00:00',
        cycle: 'monthly',
      },
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'api_request',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Asset bandwidth',
      usage: 10.0,
      limits: {
        included: 750,
        maximum: 750,
      },
      period: {
        start: '2020-06-25T00:00:00+00:00',
        end: '2020-07-24T00:00:00+00:00',
        cycle: 'monthly',
      },
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'asset_bandwidth',
      },
      unitOfMeasure: 'GB',
    },
  ],
};

export const orgResourcesWithUnlimitedAPIRequest = {
  total: 5,
  sys: {
    type: 'Array',
  },
  items: [
    {
      name: 'Free space',
      usage: 1,
      limits: {
        included: 5,
        maximum: 5,
      },
      period: null,
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'free_space',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Organization membership',
      usage: 3,
      limits: {
        included: 10,
        maximum: null,
      },
      period: null,
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'organization_membership',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Pending invitation',
      usage: 0,
      limits: {
        included: null,
        maximum: null,
      },
      period: null,
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'pending_invitation',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Api request',
      usage: 40,
      limits: {
        included: null,
        maximum: null,
      },
      period: {
        start: '2020-06-25T00:00:00+00:00',
        end: '2020-07-24T00:00:00+00:00',
        cycle: 'monthly',
      },
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'api_request',
      },
      unitOfMeasure: null,
    },
    {
      name: 'Asset bandwidth',
      usage: 10.0,
      limits: {
        included: 2000,
        maximum: null,
      },
      period: {
        start: '2020-06-25T00:00:00+00:00',
        end: '2020-07-24T00:00:00+00:00',
        cycle: 'monthly',
      },
      parent: null,
      sys: {
        type: 'OrganizationResource',
        id: 'asset_bandwidth',
      },
      unitOfMeasure: 'GB',
    },
  ],
};
