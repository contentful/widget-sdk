import React from 'react';
import { render, waitFor } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { getVariation } from 'LaunchDarkly';
import { startAppTrial, spaceSetUp } from '../services/AppTrialService';
import * as TokenStore from 'services/TokenStore';

import { StartAppTrial } from './StartAppTrial';
import { getSpaceAutoCreatedKey } from 'components/shared/auto_create_new_space/getSpaceAutoCreatedKey';

const mockedOrg = fake.Organization();
const mockedTrialSpace = fake.Space();

const mockedAppsTrial = {
  apps: ['compose', 'launch'],
  trial: {
    spaceKey: mockedTrialSpace.sys.id,
    trial: { startedAt: '2021-02-01', endsAt: '2021-02-10' },
  },
};

const build = ({ existingUsers = true } = {}) => {
  return render(<StartAppTrial orgId={mockedOrg.sys.id} existingUsers={existingUsers} />);
};

jest.mock('components/shared/auto_create_new_space/getSpaceAutoCreatedKey', () => ({
  getSpaceAutoCreatedKey: jest.fn(),
}));

jest.mock('core/services/usePlainCMAClient', () => ({
  getCMAClient: jest.fn(),
}));

const mockedStorageSet = jest.fn();

jest.mock('core/services/BrowserStorage', () => ({
  getBrowserStorage: jest.fn().mockImplementation(() => ({
    set: mockedStorageSet,
  })),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  clearCachedProductCatalogFlags: jest.fn(),
}));

jest.mock('../services/AppTrialService', () => ({
  startAppTrial: jest.fn(),
  spaceSetUp: jest.fn(),
}));

const mockedResetWithSpace = jest.fn().mockResolvedValue({});

jest.mock('core/NgRegistry', () => ({
  getModule: jest.fn().mockImplementation(() => ({
    resetWithSpace: mockedResetWithSpace,
    cma: jest.fn(),
    getEnvironmentId: jest.fn(),
    getId: jest.fn(),
  })),
}));

const mockedInstallApp = jest.fn().mockResolvedValue();

jest.mock('features/apps', () => ({
  AppManager: jest.fn().mockImplementation(() => ({
    installApp: mockedInstallApp,
  })),
}));

const mockedGetAppByIdOrSlug = jest.fn().mockResolvedValue({});

jest.mock('features/apps-core', () => ({
  getAppsRepo: jest.fn().mockImplementation(() => ({
    getAppByIdOrSlug: mockedGetAppByIdOrSlug,
  })),
}));

jest.spyOn(TokenStore, 'getSpace').mockResolvedValue(mockedTrialSpace);
jest.spyOn(TokenStore, 'refresh').mockResolvedValue({});
jest.spyOn(TokenStore, 'getUser').mockResolvedValue({});

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

  it('when trials feature flag is on and for existing users', async () => {
    getVariation.mockResolvedValueOnce(true);
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    build();

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));
    expect(mockedStorageSet).toHaveBeenCalledTimes(1);
    expect(getSpaceAutoCreatedKey).toHaveBeenCalledTimes(1);
    expect(spaceSetUp).toHaveBeenCalledTimes(0);
    expect(go).toHaveBeenCalledWith({
      path: ['spaces', 'detail'],
      params: {
        spaceId: mockedAppsTrial.trial.spaceKey,
      },
      options: { location: 'replace' },
    });
  });

  it('bootstrap the space for new users', async () => {
    getVariation.mockResolvedValueOnce(true);
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    build({ existingUsers: false });

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));

    expect(spaceSetUp).toHaveBeenCalledTimes(1);
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

  it('suppress the onboarding modal', async () => {
    getVariation.mockResolvedValueOnce(true);
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    build({ existingUsers: false });

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));

    expect(mockedStorageSet).toHaveBeenCalledTimes(1);
  });
});
