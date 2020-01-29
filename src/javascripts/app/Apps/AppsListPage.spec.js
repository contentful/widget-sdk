import React from 'react';
import { render, wait, cleanup } from '@testing-library/react';
import AppsListPage from './AppsListPage';
import repoAppsMock from './mockData/repoAppsMock.json';

jest.mock('app/common/MarkdownRenderer', () => () => null, { virtual: true });

jest.mock('MicroBackendsClient', () => {
  return () => {};
});

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: () => ({ apps: true })
}));

describe('AppsListPage', () => {
  const orgId = '123';
  const spaceId = '456';
  const userId = '000';

  afterEach(cleanup);

  it('should match snapshot for loading state', async () => {
    const { container } = render(
      <AppsListPage
        goToContent={() => {}}
        repo={{ getApps: jest.fn() }}
        organizationId={orgId}
        spaceId={spaceId}
        userId={userId}
        hasAppsFeature={true}
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
        hasAppsFeature={true}
      />
    );

    await wait();

    expect(container).toMatchSnapshot();
  });
});
