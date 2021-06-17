import React from 'react';
import { ApiKeyListRoute } from './ApiKeyListRoute';
import { render, waitForElement } from '@testing-library/react';
import { MemoryRouter } from 'core/react-routing';

import * as spaceContextMocked from 'ng/spaceContext';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';

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

jest.mock('../services/ApiKeyRepoInstance', () => ({
  getApiKeyRepo: () => mockApiKeyRepo,
}));

describe('ApiKeyListRoute', () => {
  beforeEach(() => {
    mockApiKeyRepo.create.mockReset();
    mockApiKeyRepo.getAll.mockReset();
    spaceContextMocked.organization.pricingVersion = 'pricing_version_2';
    spaceContextMocked.getId = () => 'space-id';
    spaceContextMocked.getData = jest.fn().mockImplementation((type) => {
      if (type === 'name') {
        return 'currentSpaceName';
      }
    });
    spaceContextMocked.spaceResources.get.mockResolvedValue({
      usage: 0,
      limits: {
        included: 0,
        maximum: 10,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty list', async () => {
    mockApiKeyRepo.getAll.mockResolvedValue([]);

    const { getByTestId, getByText } = render(
      <SpaceEnvContextProvider>
        <ApiKeyListRoute />
      </SpaceEnvContextProvider>,
      {
        wrapper: MemoryRouter,
      }
    );

    await waitForElement(() => {
      return getByTestId('api-keys.empty');
    });

    expect(getByTestId('add-api-key')).toBeEnabled();
    expect(getByText('Add the first API key to start delivering content')).toBeInTheDocument();
  });

  describe('when limit is reached', () => {
    beforeEach(() => {
      spaceContextMocked.spaceResources.get.mockResolvedValue({
        usage: 2,
        limits: {
          included: 0,
          maximum: 2,
        },
      });
    });

    it('should render non-empty list', async () => {
      mockApiKeyRepo.getAll.mockResolvedValue(mockKeyData);

      const { getByTestId, getByText } = render(
        <SpaceEnvContextProvider>
          <ApiKeyListRoute />
        </SpaceEnvContextProvider>,
        {
          wrapper: MemoryRouter,
        }
      );

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
