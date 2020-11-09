import { AssetView } from './AssetView';
import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { TagsRepoProvider } from 'features/content-tags';
import * as fake from 'test/helpers/fakeFactory';

jest.mock('data/CMA/FetchAll', () => ({
  fetchAll: jest.fn().mockResolvedValue(),
}));

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'Brewser' }),
}));

jest.mock('Authentication', () => ({
  ...jest.requireActual('Authentication'),
  getToken: jest.fn().mockResolvedValue('token'),
}));

jest.mock('features/content-tags/core/state/TagsRepo', () => ({
  create: jest.fn().mockReturnValue({
    readTags: jest.fn().mockResolvedValue({ items: [] }),
  }),
}));

describe('AssetView', () => {
  afterEach(cleanup);

  it('should fetch scheduled actions', async () => {
    const spy = jest.spyOn(ScheduledActionsService, 'getJobs').mockResolvedValue({ items: [] });
    const fakeSpaceData = fake.Space();
    const fakeOrganization = fake.Organization();
    const spaceEnvContextProviderValues = {
      currentEnvironmentId: 'environment-id',
      currentOrganization: fakeOrganization,
      currentOrganizationId: fakeOrganization.sys.id,
      currentSpace: {
        data: fakeSpaceData,
        environmentMeta: {
          isMasterEnvironment: true,
        },
        getAssets: jest.fn(),
      },
      currentSpaceData: fakeSpaceData,
      currentSpaceId: fakeSpaceData.sys.id,
      currentSpaceContentTypes: [],
    };

    render(
      <TagsRepoProvider>
        <SpaceEnvContext.Provider value={spaceEnvContextProviderValues}>
          <AssetView goTo={jest.fn()} />
        </SpaceEnvContext.Provider>
      </TagsRepoProvider>
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});
