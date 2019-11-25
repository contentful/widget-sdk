import React from 'react';
import { render, wait, cleanup } from '@testing-library/react';
import AppsListPage from './AppsListPage';
import repoAppsMock from './mockData/repoAppsMock.json';
import * as spaceContextMocked from 'ng/spaceContext';

spaceContextMocked.getData.mockReturnValue(true);

jest.mock('./AppMarkdown', () => () => null, { virtual: true });

jest.mock('MicroBackendsClient', () => {
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
    const { container } = render(
      <AppsListPage
        goToContent={() => {}}
        repo={{ getApps: jest.fn() }}
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
      getApps: jest.fn(() => Promise.resolve(repoAppsMock))
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
