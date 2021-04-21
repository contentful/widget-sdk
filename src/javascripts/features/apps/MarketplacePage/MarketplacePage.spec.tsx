import React from 'react';
import { render, wait } from '@testing-library/react';
import { MarketplacePage } from './index';
import {
  apps as repoAppsMock,
  contentfulApps as repoContentfulAppsMock,
} from '../__mocks__/repoAppsMock';

jest.mock('app/common/MarkdownRenderer', () => () => null);

jest.mock('MicroBackendsClient', () => () => ({}));

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: () => ({ apps: true }),
}));

const getMockAppsRepo = (apps?) => ({
  getAllApps: jest.fn(() => Promise.resolve(apps)),
});

jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: () => ({
    currentOrganizationId: '123',
    currentSpaceId: '456',
    currentSpaceName: 'my-test-space',
    currentEnvironmentId: 'master',
    currentSpace: {
      environmentMeta: {
        environmentId: 'master',
        isMasterEnvironment: true,
        aliasId: undefined,
      },
    },
  }),
}));

jest.mock('core/services/APIClient/useCurrentSpaceAPIClient', () => ({
  useCurrentSpaceAPIClient: () => ({}),
}));

jest.mock('features/trials', () => ({
  useAppsTrial: () => ({}),
}));

describe('MarketplacePage', () => {
  it('should match snapshot for loading state', async () => {
    const { container } = render(
      <MarketplacePage
        repo={getMockAppsRepo()}
        hasAppsFeature={true}
        canManageApps={true}
        hasAdvancedAppsFeature={false}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of apps loaded state', async () => {
    const mockRepo = getMockAppsRepo(repoAppsMock);

    const { container } = render(
      <MarketplacePage
        repo={mockRepo}
        hasAppsFeature={true}
        canManageApps={true}
        hasAdvancedAppsFeature={false}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of apps loaded with limited access', async () => {
    const mockRepo = getMockAppsRepo(repoAppsMock);

    const { container } = render(
      <MarketplacePage
        repo={mockRepo}
        hasAppsFeature={true}
        hasAdvancedAppsFeature={false}
        // limit the access
        canManageApps={false}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of apps and contentful apps', async () => {
    const mockRepo = getMockAppsRepo(repoContentfulAppsMock);

    const { container } = render(
      <MarketplacePage
        repo={mockRepo}
        hasAppsFeature={true}
        hasAdvancedAppsFeature={false}
        canManageApps={true}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });
});
