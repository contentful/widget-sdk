import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import {
  startAppTrial as _startAppTrial,
  contentImport as _contentImport,
} from '../services/AppTrialService';
import * as TokenStore from 'services/TokenStore';

import { StartAppTrial } from './StartAppTrial';
import { getSpaceAutoCreatedKey } from 'components/shared/auto_create_new_space/getSpaceAutoCreatedKey';
import { ContentImportError, TrialSpaceServerError } from '../utils/AppTrialError';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import { track } from 'analytics/Analytics';
import { getQueryString } from 'utils/location';

const mockedOrg = fake.Organization();
const mockedTrialSpace = fake.Space();

const mockedAppsTrial = {
  apps: ['compose', 'launch'],
  trialSpace: {
    sys: { id: mockedTrialSpace.sys.id },
  },
};

const build = ({ existingUsers = true, from = '' } = {}) => {
  return render(
    <StartAppTrial orgId={mockedOrg.sys.id} existingUsers={existingUsers} from={from} />
  );
};

jest.mock('components/shared/auto_create_new_space/getSpaceAutoCreatedKey', () => ({
  getSpaceAutoCreatedKey: jest.fn(),
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
  contentImport: jest.fn(),
}));

const mockedResetWithSpace = jest.fn();

jest.mock('classes/spaceContext', () => ({
  getSpaceContext: jest.fn().mockImplementation(() => ({
    resetWithSpace: mockedResetWithSpace,
    cma: jest.fn(),
    getEnvironmentId: jest.fn(),
    getId: jest.fn().mockReturnValue(mockedTrialSpace.sys.id),
  })),
}));

const mockedInstallApp = jest.fn();

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

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('utils/location', () => ({
  getQueryString: jest.fn().mockReturnValue({}),
}));

jest.spyOn(TokenStore, 'getSpace').mockResolvedValue(mockedTrialSpace);
jest.spyOn(TokenStore, 'refresh').mockResolvedValue();
jest.spyOn(TokenStore, 'getUser').mockResolvedValue({});

// required for cleanupNotifications
jest.useFakeTimers();

const startAppTrial = _startAppTrial as jest.Mock;
const contentImport = _contentImport as jest.Mock;

describe('StartAppTrial', () => {
  afterEach(cleanupNotifications);

  it('should navigate existing users to space home', async () => {
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    build();

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));
    expect(mockedStorageSet).toHaveBeenCalledTimes(1);
    expect(getSpaceAutoCreatedKey).toHaveBeenCalledTimes(1);
    expect(mockedInstallApp).toHaveBeenCalledTimes(2);
    expect(contentImport).toHaveBeenCalledTimes(0);
    expect(go).toHaveBeenCalledWith({
      path: ['spaces', 'detail'],
      params: {
        spaceId: mockedAppsTrial.trialSpace.sys.id,
      },
      options: { location: 'replace' },
    });
    expect(track).toHaveBeenCalledWith('trial:app_trial_started', { from: 'marketing' });
  });

  it('should perform content import on new users', async () => {
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    build({ existingUsers: false });

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));

    expect(contentImport).toHaveBeenCalledTimes(1);
    expect(go).toHaveBeenCalledWith({
      path: ['spaces', 'detail'],
      params: {
        spaceId: mockedAppsTrial.trialSpace.sys.id,
      },
      options: { location: 'replace' },
    });
  });

  describe('when start apps trial fails', () => {
    it('should redirect to the subscription page', async () => {
      startAppTrial.mockRejectedValueOnce(new TrialSpaceServerError());
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

    it('should show an error notification on 5XX errors', async () => {
      startAppTrial.mockRejectedValueOnce(new TrialSpaceServerError());
      build();

      await waitFor(() => screen.getByTestId('cf-ui-notification'));
      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
      expect(screen.getByTestId('cf-ui-notification')).toHaveTextContent('start your trial');
    });

    it('should not show an error notification on other errors', async () => {
      startAppTrial.mockRejectedValueOnce(new Error());
      build();

      await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));
      expect(screen.queryByTestId('cf-ui-notification')).not.toBeInTheDocument();
    });
  });

  describe('when app installation fails', () => {
    beforeEach(() => {
      startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
      mockedInstallApp.mockRejectedValue(new Error());
    });

    it('should redirect to the trial space home', async () => {
      build();

      await waitFor(() => expect(mockedInstallApp).toHaveBeenCalledTimes(2));
      expect(go).toHaveBeenCalledWith({
        path: ['spaces', 'detail'],
        params: {
          spaceId: mockedAppsTrial.trialSpace.sys.id,
        },
        options: { location: 'replace' },
      });
    });

    it('should show a correct notification when all installations fail', async () => {
      build();

      await waitFor(() => screen.getByTestId('cf-ui-notification'));
      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
      expect(screen.getByTestId('cf-ui-notification')).toHaveTextContent('Compose + Launch');
    });

    it('should show a correct notification when one installation fails', async () => {
      mockedInstallApp.mockRejectedValueOnce(new Error()).mockResolvedValueOnce(undefined);

      build();

      await waitFor(() => screen.getByTestId('cf-ui-notification'));
      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
      expect(screen.getByTestId('cf-ui-notification')).toHaveTextContent('Compose.');
    });
  });

  describe('when content import fails', () => {
    beforeEach(() => {
      startAppTrial.mockResolvedValue(mockedAppsTrial);
      mockedInstallApp.mockResolvedValue(undefined);
      contentImport.mockRejectedValue(new ContentImportError());
    });

    it('should redirect to the trial space home', async () => {
      build({ existingUsers: false });

      await waitFor(() => expect(contentImport).toHaveBeenCalledTimes(1));

      expect(go).toHaveBeenCalledWith({
        path: ['spaces', 'detail'],
        params: {
          spaceId: mockedAppsTrial.trialSpace.sys.id,
        },
        options: { location: 'replace' },
      });
    });

    it('should not show a notification', async () => {
      build({ existingUsers: false });

      await waitFor(() => expect(contentImport).toHaveBeenCalledTimes(1));
      expect(screen.queryByTestId('cf-ui-notification')).not.toBeInTheDocument();
    });
  });

  it('suppress the onboarding modal', async () => {
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    build({ existingUsers: false });

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));

    expect(mockedStorageSet).toHaveBeenCalledTimes(1);
  });

  it('track the app_trial_started event correctly', async () => {
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);

    build({ existingUsers: false, from: 'from_props' });

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));

    expect(track).toHaveBeenCalledWith('trial:app_trial_started', { from: 'from_props' });
  });

  it('track the app_trial_started event with query string params', async () => {
    startAppTrial.mockResolvedValueOnce(mockedAppsTrial);
    (getQueryString as jest.Mock).mockReturnValue({ from: 'from_query_params' });

    build({ existingUsers: false });

    await waitFor(() => expect(startAppTrial).toHaveBeenCalledTimes(1));

    expect(track).toHaveBeenCalledWith('trial:app_trial_started', { from: 'from_query_params' });
  });
});
