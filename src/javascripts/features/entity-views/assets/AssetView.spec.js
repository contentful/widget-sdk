import { AssetView } from './AssetView';
import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { TagsRepoProvider } from 'features/content-tags';

jest.mock('data/CMA/FetchAll', () => ({
  fetchAll: jest.fn().mockResolvedValue(),
}));

jest.mock('ng/spaceContext');

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'Brewser' }),
}));

jest.mock('Authentication', () => ({
  ...jest.requireActual('Authentication'),
  getToken: jest.fn().mockResolvedValue('token'),
}));

jest.mock('services/PubSubService', () => ({
  on: jest.fn(),
  off: jest.fn(),
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
      <TagsRepoProvider>
        <SpaceEnvContextProvider>
          <AssetView goTo={jest.fn()} />
        </SpaceEnvContextProvider>
      </TagsRepoProvider>
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});