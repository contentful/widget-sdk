import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { RecordsResourceUsage } from './RecordsResourceUsage';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import * as spaceContextMocked from 'ng/spaceContext';

const build = () => {
  return render(
    <SpaceEnvContextProvider>
      <RecordsResourceUsage />
    </SpaceEnvContextProvider>
  );
};

const makeResource = (usage) => ({
  name: 'Record',
  usage,
  limits: {
    included: 10,
    maximum: 10,
  },
});

describe('RecordsResourceUsage', () => {
  beforeEach(() => {
    spaceContextMocked.environmentResources.get.mockResolvedValue(makeResource());
  });

  it('should attempt to get the resource when mounted', async () => {
    build();

    await waitFor(() =>
      expect(spaceContextMocked.environmentResources.get).toHaveBeenCalledTimes(1)
    );
  });

  it('should have the basic resource-usage class', async () => {
    const { queryByTestId } = build();

    await waitFor(() => expect(queryByTestId('container')).toHaveClass('resource-usage'));
  });

  it('should add the resource-usage--warn class if near the limit', async () => {
    spaceContextMocked.environmentResources.get.mockResolvedValue(makeResource(9));

    const { queryByTestId } = build();

    await waitFor(() => expect(queryByTestId('container')).toHaveClass('resource-usage--warn'));
  });

  it('should add the resource-usage--danger class if at the limit', async () => {
    spaceContextMocked.environmentResources.get.mockResolvedValue(makeResource(10));

    const { queryByTestId } = build();

    await waitFor(() => expect(queryByTestId('container')).toHaveClass('resource-usage--danger'));
  });
});
