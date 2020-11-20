import React from 'react';
import SpaceUsage from './SpaceUsage';
import { render, screen } from '@testing-library/react';
import { getVariation } from 'LaunchDarkly';

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

jest.mock('services/ResourceService', () => ({
  __esModule: true,
  default: () => ({
    getAll: jest.fn(async () => mockResourcesResponse),
  }),
}));

jest.mock('./services/EntitlementService', () => ({
  ...jest.requireActual('./services/EntitlementService'),
  getSpaceEntitlementSet: jest.fn(() => mockedResponse),
}));

describe('SpaceUsage', () => {
  const build = async () => {
    render(<SpaceUsage spaceId={spaceId} environmentMeta={environmentMetaMock} />);
    await screen.findByTestId('resource-list');
  };

  beforeEach(() => {
    getVariation.mockResolvedValue(false);
  });

  it('should render Content type entiltement from Recources when flag is disabled', async () => {
    await build();
    const entitlement = screen.getByTestId('Content type');
    expect(entitlement).toHaveTextContent(mockResourcesResponse[0].limits.maximum);
  });

  it('should render Entry entiltement from Recources when flag is disabled', async () => {
    await build();
    const entitlement = screen.getByTestId('Entry');
    expect(entitlement).toHaveTextContent(mockResourcesResponse[1].limits.maximum);
  });

  it('should render Asset entiltement from Recources when flag is disabled', async () => {
    await build();
    const entitlement = screen.getByTestId('Asset');
    expect(entitlement).toHaveTextContent(mockResourcesResponse[2].limits.maximum);
  });

  it('should render Role entiltement from Recources when flag is disabled', async () => {
    await build();
    const entitlement = screen.getByTestId('Role');
    expect(entitlement).toHaveTextContent(mockResourcesResponse[3].limits.maximum);
  });

  it('should render Locale entiltement from Recources when flag is disabled', async () => {
    await build();
    const entitlement = screen.getByTestId('Locale');
    expect(entitlement).toHaveTextContent(mockResourcesResponse[4].limits.maximum);
  });

  it('should render Content type entiltement from new API when flag is enabled', async () => {
    getVariation.mockResolvedValueOnce(true);
    await build();

    const entitlement = screen.getByTestId('Content type');
    expect(entitlement).toHaveTextContent(mockedResponse.quotas.contentTypes.value);
  });

  it('should render Role entiltement from new API when flag is enabled', async () => {
    getVariation.mockResolvedValueOnce(true);
    await build();

    const rolesEntiltement = screen.getByTestId('Role');
    expect(rolesEntiltement).toHaveTextContent(mockedResponse.quotas.roles.value);
  });

  it('should render Locale entiltement from new API when flag is enabled', async () => {
    getVariation.mockResolvedValueOnce(true);
    await build();

    const entiltement = screen.getByTestId('Locale');
    expect(entiltement).toHaveTextContent(mockedResponse.quotas.locales.value);
  });

  it('should render Environment entiltement from new API when flag is enabled', async () => {
    getVariation.mockResolvedValueOnce(true);
    await build();

    const entiltement = screen.getByTestId('Environment');
    expect(entiltement).toHaveTextContent(mockedResponse.quotas.environments.value);
  });

  it('should render Record entiltement from new API when flag is enabled', async () => {
    getVariation.mockResolvedValueOnce(true);
    await build();

    const entiltement = screen.getByTestId('Record');
    expect(entiltement).toHaveTextContent(mockedResponse.quotas.records.value);
  });
});
