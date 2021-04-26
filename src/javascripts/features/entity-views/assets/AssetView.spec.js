import { AssetView } from './AssetView';
import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { TagsRepoProvider } from 'features/content-tags';

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
    render(
      <SpaceEnvContextProvider>
        <TagsRepoProvider>
          <AssetView goTo={jest.fn()} />
        </TagsRepoProvider>
      </SpaceEnvContextProvider>
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});
