import React from 'react';
import SpaceUsage from './SpaceUsage';
import { render, screen } from '@testing-library/react';
import { useFeatureFlag } from 'core/feature-flags';
import { cloneDeep, keyBy } from 'lodash';
import { getSpaceEntitlementSet } from './services/EntitlementService';

const spaceId = 'spaceId';
const environmentMetaMock = {
  aliasId: 'aliasId',
  environmentId: 'environmentId',
  isMasterEnvironment: true,
};

const mockedResponse = {
  features: {},
  quotas: {
    locales: {
      value: 23131935,
    },
    contentTypes: {
      value: 17394481,
    },
    environments: {
      value: 27857587,
    },
    records: {
      value: 82177619,
    },
    roles: {
      value: 58588586,
    },
  },
  traits: {
    defaultRoles: [],
  },
  sys: {},
};

const mockResourcesResponse = [
  {
    name: 'Content type',
    usage: 4,
    limits: { included: 96, maximum: 96 },
    parent: null,
    kind: 'permanent',
    period: null,
    sys: { type: 'SpaceResource', id: 'content_type' },
    unitOfMeasure: null,
  },
  {
    name: 'Entry',
    usage: 3,
    limits: { included: 100000, maximum: 100000 },
    parent: {
      name: 'Record',
      usage: 4,
      limits: { included: 100000, maximum: 100000 },
      parent: null,
      kind: 'permanent',
      period: null,
      sys: { type: 'SpaceResource', id: 'record' },
      unitOfMeasure: null,
    },
    kind: 'permanent',
    period: null,
    sys: { type: 'SpaceResource', id: 'entry' },
    unitOfMeasure: null,
  },
  {
    name: 'Asset',
    usage: 1,
    limits: { included: 100000, maximum: 100000 },
    parent: {
      name: 'Record',
      usage: 4,
      limits: { included: 100000, maximum: 100000 },
      parent: null,
      kind: 'permanent',
      period: null,
      sys: { type: 'SpaceResource', id: 'record' },
      unitOfMeasure: null,
    },
    kind: 'permanent',
    period: null,
    sys: { type: 'SpaceResource', id: 'asset' },
    unitOfMeasure: null,
  },
  {
    name: 'Role',
    usage: 4,
    limits: { included: 7, maximum: 7 },
    parent: null,
    kind: 'permanent',
    period: null,
    sys: { type: 'SpaceResource', id: 'role' },
    unitOfMeasure: null,
  },
  {
    name: 'Locale',
    usage: 1,
    limits: { included: 30, maximum: 30 },
    parent: null,
    kind: 'permanent',
    period: null,
    sys: { type: 'SpaceResource', id: 'locale' },
    unitOfMeasure: null,
  },
  {
    name: 'Environment',
    usage: 0,
    limits: { included: 10, maximum: 10 },
    parent: null,
    kind: 'permanent',
    period: null,
    sys: { type: 'SpaceResource', id: 'environment' },
    unitOfMeasure: null,
  },
  {
    name: 'Record',
    usage: 4,
    limits: { included: 100000, maximum: 100000 },
    parent: null,
    kind: 'permanent',
    period: null,
    sys: { type: 'SpaceResource', id: 'record' },
    unitOfMeasure: null,
  },
  {
    kind: 'permanent',
    limits: { included: null, maximum: null },
    name: 'Space membership',
    parent: null,
    period: null,
    sys: { type: 'SpaceResource', id: 'space_membership' },
    unitOfMeasure: null,
    usage: 1,
  },
  {
    kind: 'permanent',
    limits: { included: null, maximum: null },
    name: 'Api key',
    parent: null,
    period: null,
    sys: { type: 'SpaceResource', id: 'api_key' },
    unitOfMeasure: null,
    usage: 1,
  },
  {
    kind: 'permanent',
    limits: { included: null, maximum: null },
    name: 'Webhook definition',
    parent: null,
    period: null,
    sys: { type: 'SpaceResource', id: 'webhook_definition' },
    unitOfMeasure: null,
    usage: 0,
  },
];

const mockEnvResourcesResponse = mockResourcesResponse.filter((resource) =>
  ['Content type', 'Entry', 'Asset', 'Role', 'Locale', 'Record'].includes(resource.name)
);

function getAllRenderedResources() {
  const displayedResources = ['Content type', 'Entry', 'Asset', 'Role', 'Locale'];

  return displayedResources.reduce((memo, resource) => {
    memo[resource] = screen.getByTestId(resource);
    return memo;
  }, {});
}

jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn().mockReturnValue({
    currentSpaceId: spaceId,
    currentSpace: {
      environmentMeta: environmentMetaMock,
    },
    environmentResources: {
      getAll: jest.fn(async () => mockEnvResourcesResponse),
    },
    spaceResources: {
      getAll: jest.fn(async () => mockResourcesResponse),
    },
  }),
}));

jest.mock('./services/EntitlementService', () => ({
  ...jest.requireActual('./services/EntitlementService'),
  getSpaceEntitlementSet: jest.fn(async () => mockedResponse),
}));

describe('SpaceUsage', () => {
  const build = async () => {
    render(<SpaceUsage />);
    await screen.findByTestId('resource-list');
  };

  describe('when Entitlements API is disabled', () => {
    beforeEach(async () => {
      useFeatureFlag.mockReturnValue([false]);
      await build();
    });

    it('should render resources from Recources API when flag is disabled', async () => {
      const mockData = keyBy(mockResourcesResponse, 'name');
      const resources = getAllRenderedResources();
      expect(resources['Content type']).toHaveTextContent(mockData['Content type'].limits.maximum);
      expect(resources['Entry']).toHaveTextContent(mockData['Entry'].limits.maximum);
      expect(resources['Asset']).toHaveTextContent(mockData['Asset'].limits.maximum);
      expect(resources['Role']).toHaveTextContent(mockData['Role'].limits.maximum);
      expect(resources['Locale']).toHaveTextContent(mockData['Locale'].limits.maximum);
    });
  });

  describe('when Entitlements API is enabled', () => {
    beforeEach(async () => {
      useFeatureFlag.mockReturnValue([true]);
      await build();
    });

    it('should render Content type entiltement from new API when flag is enabled', async () => {
      const resources = getAllRenderedResources();
      expect(resources['Content type']).toHaveTextContent(mockedResponse.quotas.contentTypes.value);
      expect(resources['Role']).toHaveTextContent(mockedResponse.quotas.roles.value);
      expect(resources['Entry']).toHaveTextContent(mockedResponse.quotas.records.value);
      expect(resources['Asset']).toHaveTextContent(mockedResponse.quotas.records.value);
      expect(resources['Locale']).toHaveTextContent(mockedResponse.quotas.locales.value);
    });
  });

  it('should still render when entitlement is not available', async () => {
    const mockData = cloneDeep(mockedResponse);
    delete mockData.quotas.roles;
    getSpaceEntitlementSet.mockResolvedValueOnce(mockData);
    useFeatureFlag.mockReturnValue([true]);
    await build();
    const resources = getAllRenderedResources();
    expect(resources['Role']).not.toHaveTextContent();
  });
});
