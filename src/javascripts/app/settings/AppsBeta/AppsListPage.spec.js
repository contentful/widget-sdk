import React from 'react';
import { render, wait, cleanup } from '@testing-library/react';
import AppsListPage from './AppsListPage.es6';
import appsListingMock from './mockData/appsListingMock.json';
import devAppsMock from './mockData/devAppsMock.json';
import repoAppsMock from './mockData/repoAppsMock.json';
import * as spaceContextMocked from 'ng/spaceContext';

spaceContextMocked.getData.mockReturnValue(true);

jest.mock('./AppMarkdown.es6', () => () => null, { virtual: true });

jest.mock('MicroBackendsClient.es6', () => {
  return () => {};
});

describe('AppsListPage', () => {
  const orgId = '123';
  const spaceId = '456';
  const userId = '000';
  const mockProductCatalog = {
    loadProductCatalogFlags: jest.fn(() =>
      Promise.resolve({
        basic_apps: true,
        optimizely_app: true
      })
    ),
    isAppsFeatureDisabled: () => Promise.resolve(false),
    isAppEnabled: () => true
  };

  afterEach(cleanup);

  it('should match snapshot for loading state', async () => {
    const mockRepo = {
      getApps: jest.fn(),
      getMarketplaceApps: jest.fn(),
      getDevApps: jest.fn(),
      isDevApp: jest.fn()
    };

    const { container } = render(
      <AppsListPage
        goToContent={() => {}}
        repo={mockRepo}
        organizationId={orgId}
        spaceId={spaceId}
        userId={userId}
        productCatalog={mockProductCatalog}
      />
    );

    expect(container).toMatchSnapshot();
  });
  it('should match snapshot of apps loaded state', async () => {
    const mockRepo = {
      getApps: jest.fn(() => Promise.resolve(repoAppsMock)),
      getMarketplaceApps: jest.fn(() => Promise.resolve(appsListingMock)),
      getDevApps: jest.fn(() => Promise.resolve(devAppsMock)),
      isDevApp: jest.fn()
    };

    const { container } = render(
      <AppsListPage
        goToContent={() => {}}
        repo={mockRepo}
        organizationId={orgId}
        spaceId={spaceId}
        userId={userId}
        productCatalog={mockProductCatalog}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });
});
