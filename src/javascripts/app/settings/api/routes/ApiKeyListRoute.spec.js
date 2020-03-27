import React from 'react';
import ApiKeyListRoute from './ApiKeyListRoute';
import { render, waitForElement } from '@testing-library/react';

import * as spaceContextMocked from 'ng/spaceContext';

let mockedResource;

const mockApiKeyRepo = {
  getAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(),
};

const mockKeyData = [
  {
    name: 'My Api Key',
    description: 'This is some description',
    sys: {
      id: '51h8tYBHHbMmt9btNNC5kR',
    },
  },
  {
    name: 'My Second Api Key',
    description: 'This is some description',
    sys: {
      id: '61h8tYBHHbMmt9btNNC5kR',
    },
  },
];

jest.mock('app/settings/api/services/ApiKeyRepoInstance', () => ({
  getApiKeyRepo: () => mockApiKeyRepo,
}));

jest.mock('ng/spaceContext', () => ({
  getId: () => 'space-id',
  organization: {
    pricingVersion: 'pricing_version_2',
  },
  getData: jest.fn().mockImplementation((type) => {
    if (type === 'name') {
      return 'currentSpaceName';
    }
  }),
}));

jest.mock('services/ResourceService', () => () => ({
  get: jest.fn().mockResolvedValue(mockedResource),
}));

describe('ApiKeyListRoute', () => {
  beforeEach(() => {
    mockApiKeyRepo.create.mockReset();
    mockApiKeyRepo.getAll.mockReset();
    spaceContextMocked.organization.pricingVersion = 'pricing_version_2';
    mockedResource = {
      usage: 0,
      limits: {
        included: 0,
        maximum: 10,
      },
    };
  });

  it('should render empty list', async () => {
    mockApiKeyRepo.getAll.mockResolvedValue([]);

    const { getByTestId, getByText } = render(<ApiKeyListRoute />);

    await waitForElement(() => {
      return getByTestId('api-keys.empty');
    });

    expect(getByTestId('add-api-key')).toBeEnabled();
    expect(getByText('Add the first API key to start delivering content')).toBeInTheDocument();
  });

  it('should render non-empty list', async () => {
    spaceContextMocked.organization.pricingVersion = 'pricing_version_1';
    mockApiKeyRepo.getAll.mockResolvedValue(mockKeyData);

    const { getByTestId, getByText } = render(<ApiKeyListRoute />);

    await waitForElement(() => {
      return getByTestId('api-key-list');
    });

    expect(getByTestId('add-api-key')).toBeEnabled();
    mockKeyData.forEach((key) => {
      expect(getByText(key.name)).toBeInTheDocument();
    });
  });

  describe('when limit is reached', () => {
    beforeEach(() => {
      mockedResource = {
        usage: 2,
        limits: {
          included: 0,
          maximum: 2,
        },
      };
    });

    it('should render non-empty list', async () => {
      mockApiKeyRepo.getAll.mockResolvedValue(mockKeyData);

      const { getByTestId, getByText } = render(<ApiKeyListRoute />);

      await waitForElement(() => {
        return getByTestId('api-key-table');
      });

      expect(getByTestId('add-api-key')).toBeDisabled();
      mockKeyData.forEach((key) => {
        expect(getByText(key.name)).toBeInTheDocument();
      });
    });
  });
});
