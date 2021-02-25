import React from 'react';
import { render, waitFor } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { getVariation } from 'LaunchDarkly';
import { startAppTrial } from 'features/trials';
import * as TokenStore from 'services/TokenStore';

import { StartAppTrial } from './StartAppTrial';

const mockedOrg = fake.Organization();
const mockedTrialSpace = fake.Space();

const mockedAppsTrial = {
  apps: ['compose', 'launch'],
  trial: {
    spaceKey: mockedTrialSpace.sys.id,
    trial: { startedAt: '2021-02-01', endsAt: '2021-02-10' },
  },
};

const build = () => {
  return render(<StartAppTrial orgId={mockedOrg.sys.id} />);
};

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  clearCachedProductCatalogFlags: jest.fn(),
}));

jest.mock('features/trials', () => ({
  startAppTrial: jest.fn(),
}));

const mockResetWithSpace = jest.fn().mockResolvedValue({});

jest.mock('core/NgRegistry', () => ({
  getModule: jest.fn().mockImplementation(() => ({
    resetWithSpace: mockResetWithSpace,
    cma: jest.fn(),
    getEnvironmentId: jest.fn(),
    getId: jest.fn(),
  })),
}));

const mockInstallApp = jest.fn().mockResolvedValue();

jest.mock('features/apps', () => ({
  AppManager: jest.fn().mockImplementation(() => ({
    installApp: mockInstallApp,
  })),
}));

const mockGetAppByIdOrSlug = jest.fn().mockResolvedValue({});

jest.mock('features/apps-core', () => ({
  getAppsRepo: jest.fn().mockImplementation(() => ({
    getAppByIdOrSlug: mockGetAppByIdOrSlug,
  })),
}));

jest.spyOn(TokenStore, 'getSpace').mockResolvedValue(mockedTrialSpace);
jest.spyOn(TokenStore, 'refresh').mockResolvedValue({});

describe('StartAppTrial', () => {
  it('when trials feature flag is off', async () => {
    getVariation.mockResolvedValueOnce(false);
    build();

    await waitFor(() => expect(getVariation).toHaveBeenCalledTimes(1));
    expect(go).toHaveBeenCalledWith({
      path: ['account', 'organizations', 'subscription_new'],
      params: {
        orgId: mockedOrg.sys.id,
      },
      options: { location: 'replace' },
    });
  });

  it('when trials feature flag is on', async () => {
    getVariation.mockResolvedValueOnce(true);
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    build();

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));
    expect(go).toHaveBeenCalledWith({
      path: ['spaces', 'detail'],
      params: {
        spaceId: mockedAppsTrial.trial.spaceKey,
      },
      options: { location: 'replace' },
    });
  });

  it('should redirect to the subscription page when start app trial fails', async () => {
    getVariation.mockResolvedValueOnce(true);
    startAppTrial.mockRejectedValue({});
    build();

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));
    expect(go).toHaveBeenCalledWith({
      path: ['account', 'organizations', 'subscription_new'],
      params: {
        orgId: mockedOrg.sys.id,
      },
      options: { location: 'replace' },
    });
  });
});
