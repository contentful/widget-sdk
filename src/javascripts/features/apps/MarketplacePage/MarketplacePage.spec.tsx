import React from 'react';
import { render, wait } from '@testing-library/react';
import { MarketplacePage } from './index';
import {
  apps as repoAppsMock,
  contentfulApps as repoContentfulAppsMock,
} from '../__mocks__/repoAppsMock';
import { noop } from 'lodash';

jest.mock('app/common/MarkdownRenderer', () => () => null);

jest.mock('MicroBackendsClient', () => () => ({}));

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: () => ({ apps: true }),
}));

const getMockAppsRepo = (apps?) => ({
  getAllApps: jest.fn(() => Promise.resolve(apps)),
});

describe('MarketplacePage', () => {
  const orgId = '123';
  const spaceId = '456';
  const userId = '000';
  const spaceInformation = {
    spaceId: spaceId,
    spaceName: 'my-test-space',
    envMeta: {
      environmentId: 'master',
      isMasterEnvironment: true,
      aliasId: undefined,
    },
  };

  it('should match snapshot for loading state', async () => {
    const { container } = render(
      <MarketplacePage
        cma={{}}
        repo={getMockAppsRepo()}
        organizationId={orgId}
        userId={userId}
        hasAppsFeature={true}
        spaceInformation={spaceInformation}
        canManageApps={true}
        hasAdvancedAppsFeature={false}
        openAppDetails={noop}
        closeAppDetails={noop}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of apps loaded state', async () => {
    const mockRepo = getMockAppsRepo(repoAppsMock);

    const { container } = render(
      <MarketplacePage
        cma={{}}
        repo={mockRepo}
        organizationId={orgId}
        userId={userId}
        hasAppsFeature={true}
        spaceInformation={spaceInformation}
        canManageApps={true}
        hasAdvancedAppsFeature={false}
        openAppDetails={noop}
        closeAppDetails={noop}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of apps loaded with limited access', async () => {
    const mockRepo = getMockAppsRepo(repoAppsMock);

    const { container } = render(
      <MarketplacePage
        cma={{}}
        repo={mockRepo}
        organizationId={orgId}
        userId={userId}
        hasAppsFeature={true}
        hasAdvancedAppsFeature={false}
        spaceInformation={spaceInformation}
        // limit the access
        canManageApps={false}
        openAppDetails={noop}
        closeAppDetails={noop}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of apps and contentful apps', async () => {
    const mockRepo = getMockAppsRepo(repoContentfulAppsMock);

    const { container } = render(
      <MarketplacePage
        cma={{}}
        repo={mockRepo}
        organizationId={orgId}
        userId={userId}
        hasAppsFeature={true}
        hasAdvancedAppsFeature={false}
        spaceInformation={spaceInformation}
        canManageApps={true}
        openAppDetails={noop}
        closeAppDetails={noop}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });
});
