import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { TrialTag, TrialTagProps } from './TrialTag';
import * as fake from 'test/helpers/fakeFactory';
import { getOrganization as _getOrganization } from 'services/TokenStore';
import { track } from 'analytics/Analytics';
import { isOwnerOrAdmin as _isOwnerOrAdmin } from 'services/OrganizationRoles';
import { href, isOrgRoute as _isOrgRoute } from 'states/Navigator';
import { getTrial as _getTrial } from '../services/AppTrialRepo';
import { useAppsTrial as _useAppsTrial } from '../hooks/useAppsTrials';
import { useSpaceEnvContext as _useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isSpaceAccessible as _isSpaceAccessible } from '../utils/utils';

const trialEndsAt = '2020-10-10';
const trialEndedAt = '2020-09-10';
const readOnlyAt = '2020-08-13';
const today = '2020-10-01T03:00:00.000Z';
const daysLeft = 9;

const trialOrganization = fake.Organization({
  trialPeriodEndsAt: trialEndsAt,
});

const trialExpiredOrganization = fake.Organization({
  trialPeriodEndsAt: trialEndedAt,
});

const organizationNotOnTrial = fake.Organization();

const trialSpace = fake.Space({
  organization: organizationNotOnTrial,
  trialPeriodEndsAt: trialEndsAt,
});

const trialExpiredSpace = fake.Space({
  trialPeriodEndsAt: trialEndedAt,
});

const readOnlyTrialSpace = {
  ...trialSpace,
  readOnlyAt,
};

const readOnlyExpiredTrialSpace = {
  ...trialExpiredSpace,
  readOnlyAt,
};

const activeAppTrial = {
  enabled: true,
  sys: {
    trial: {
      endsAt: trialEndsAt,
    },
  },
};

const expiredAppTrial = {
  enabled: false,
  sys: {
    trial: {
      endsAt: trialEndedAt,
    },
  },
};

const purchasedAppTrial = {
  enabled: true,
  sys: {
    trial: {
      endsAt: trialEndedAt,
    },
  },
};

const spaceNotOnTrial = (organization: unknown) =>
  fake.Space({
    organization,
  });

const build = (props?: TrialTagProps) => {
  render(<TrialTag {...props} />);
};

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
  getCurrentStateName: jest.fn(),
  isOrgRoute: jest.fn(),
}));

jest.mock('../services/AppTrialRepo', () => ({
  getTrial: jest.fn(),
}));

jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn().mockReturnValue({}),
}));

jest.mock('../hooks/useAppsTrials', () => ({
  useAppsTrial: jest.fn().mockReturnValue({}),
}));

jest.mock('../utils/utils', () => ({
  ...(jest.requireActual('../utils/utils') as Record<string, unknown>),
  isSpaceAccessible: jest.fn().mockResolvedValue(true),
}));

const getOrganization = _getOrganization as jest.Mock;
const isOrgRoute = _isOrgRoute as jest.Mock;
const isOwnerOrAdmin = _isOwnerOrAdmin as jest.Mock;
const getTrial = (_getTrial as unknown) as jest.Mock;
const useSpaceEnvContext = _useSpaceEnvContext as jest.Mock;
const useAppsTrial = _useAppsTrial as jest.Mock;
const isSpaceAccessible = _isSpaceAccessible as jest.Mock;

describe('TrialTag', () => {
  beforeEach(() => {
    isOwnerOrAdmin.mockReturnValue(false);
    useAppsTrial.mockReturnValue({
      appsTrialSpaceKey: trialSpace.sys.id,
    });
    const mockedNow = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => mockedNow);
  });

  it('does not render the trial tag on AccountSettingNavbar or ErrorNavbar', async () => {
    isOrgRoute.mockReturnValue(false);

    build();

    await waitFor(() => screen.queryByTestId('enterprise_trial_tag'));
    expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();

    expect(getOrganization).toHaveBeenCalledTimes(0);
    expect(getTrial).toHaveBeenCalledTimes(0);
  });

  describe('Enterprise trial', () => {
    beforeEach(() => {
      isOrgRoute.mockReturnValue(true);
    });

    it('renders when the organization is on trial and the navbar is OrgSettingsNavbar', async () => {
      getOrganization.mockResolvedValue(trialOrganization);

      build({ organizationId: trialOrganization.sys.id });

      await waitFor(() =>
        expect(screen.getByTestId('enterprise_trial_tag')).toHaveTextContent('TRIAL')
      );
      fireEvent.mouseOver(screen.getByTestId('enterprise_trial_tag-link'));
      await waitFor(() =>
        expect(screen.getByTestId('trial_tag-tooltip')).toHaveTextContent(`${daysLeft} DAYS`)
      );
    });

    it('navigates to the subscription page when clicked', async () => {
      getOrganization.mockResolvedValue(trialOrganization);
      build({ organizationId: trialOrganization.sys.id });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await waitFor(() => fireEvent.click(screen.queryByTestId('enterprise_trial_tag-link')!));

      expect(href).toHaveBeenCalledWith({
        path: 'account.organizations.subscription_new',
        params: { orgId: trialOrganization.sys.id },
      });

      expect(track).toHaveBeenCalledWith('trial:trial_tag_clicked', {
        type: 'enterprise_trial_tag',
        numTrialDaysLeft: daysLeft,
        isOwnerOrAdmin: false,
      });
    });

    it('does not render if the trial has ended', async () => {
      getOrganization.mockResolvedValue(trialExpiredOrganization);
      build({ organizationId: trialExpiredOrganization.sys.id });

      await waitFor(() => screen.queryByTestId('enterprise_trial_tag'));
      expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render if the organization is not on trial', async () => {
      getOrganization.mockResolvedValue(organizationNotOnTrial);
      build({ organizationId: organizationNotOnTrial.sys.id });

      await waitFor(() => screen.queryByTestId('enterprise_trial_tag'));
      expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    });

    it('renders when the organization is on trial and the navbar is SpaceNavbar', async () => {
      const space = spaceNotOnTrial(trialOrganization);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: space,
      });
      isOrgRoute.mockReturnValue(false);
      build();

      await waitFor(() => expect(screen.getByTestId('enterprise_trial_tag')).toBeInTheDocument());
    });
  });

  describe('Space trial', () => {
    beforeEach(() => {
      isOrgRoute.mockReturnValue(false);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: trialSpace,
      });
    });

    it('renders when the space is on trial and the navbar is SpaceNavbar', async () => {
      build();

      await waitFor(() => expect(screen.getByTestId('trial_space_tag')).toHaveTextContent('TRIAL'));
    });

    it('renders when the trial has ended', async () => {
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: trialExpiredSpace,
      });

      build();

      await waitFor(() =>
        expect(screen.queryByTestId('trial_space_tag')).toHaveTextContent('TRIAL')
      );
      fireEvent.mouseOver(screen.getByTestId('trial_space_tag-link'));
      await waitFor(() =>
        expect(screen.getByTestId('trial_tag-tooltip')).toHaveTextContent('EXPIRED')
      );
    });

    it('does not render when the active trial space becomes read-only', async () => {
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: readOnlyTrialSpace,
      });

      build();

      await waitFor(() => screen.queryByTestId('trial_space_tag'));
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('does not render when the expired trial space becomes read-only', async () => {
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: readOnlyExpiredTrialSpace,
      });

      build();

      await waitFor(() => screen.queryByTestId('trial_space_tag'));
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('navigates to the space home when clicked', async () => {
      build();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await waitFor(() => fireEvent.click(screen.queryByTestId('trial_space_tag-link')!));
      expect(href).toHaveBeenCalledWith({
        path: 'spaces.detail.home',
        params: { spaceId: trialSpace.sys.id },
      });

      expect(track).toHaveBeenCalledWith('trial:trial_tag_clicked', {
        type: 'trial_space_tag',
        numTrialDaysLeft: daysLeft,
        isOwnerOrAdmin: false,
      });
    });

    it('does not render if neither the space nor organization is on trial', async () => {
      const mockSpace = spaceNotOnTrial(organizationNotOnTrial);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: mockSpace,
      });

      build();

      await waitFor(() => screen.queryByTestId('trial_space_tag'));
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render when the space is on trial but the navbar is OrgSettingsNavbar', async () => {
      isOrgRoute.mockReturnValue(true);
      getOrganization.mockReturnValue(organizationNotOnTrial);

      build({ organizationId: organizationNotOnTrial.sys.id });

      await waitFor(() => screen.queryByTestId('space-trial-tag'));
      expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument();
    });

    it('renders when only the Trial App is purchased and the Trial Space becomes expired', async () => {
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: trialExpiredSpace,
      });
      getTrial.mockResolvedValue(purchasedAppTrial);

      build();

      await waitFor(() => screen.getByTestId('trial_space_tag'));
      expect(screen.getByTestId('trial_space_tag')).toHaveTextContent('TRIAL');
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
    });
  });

  describe('App trial', () => {
    beforeEach(() => {
      isOrgRoute.mockReturnValue(false);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: trialSpace,
      });
      getTrial.mockResolvedValue(activeAppTrial);
      getOrganization.mockResolvedValue(organizationNotOnTrial);
    });

    it('renders when the App Trial is active and the navbar is OrgSettingsNavbar', async () => {
      isOrgRoute.mockReturnValue(true);
      build({ organizationId: organizationNotOnTrial.sys.id });

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
    });

    it('navigates to the App Trial Space Home when clicked', async () => {
      build();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await waitFor(() => fireEvent.click(screen.queryByTestId('app_trial_tag-link')!));

      expect(href).toHaveBeenCalledWith({
        path: 'spaces.detail.home',
        params: { spaceId: trialSpace.sys.id },
      });

      expect(track).toHaveBeenCalledWith('trial:trial_tag_clicked', {
        type: 'app_trial_tag',
        numTrialDaysLeft: daysLeft,
        isOwnerOrAdmin: false,
      });
    });

    it('renders non-clickable tag when the user is not a space member', async () => {
      isSpaceAccessible.mockResolvedValue(false);
      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
      expect(screen.queryByTestId('app_trial_tag-link')).not.toBeInTheDocument();
    });

    it('renders when the App Trial is active and the navbar is SpaceNavbar', async () => {
      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
    });

    it('renders when the App Trial is expired and the navbar is SpaceNavbar', async () => {
      useAppsTrial.mockReturnValue({ appsTrialSpaceKey: trialExpiredSpace.sys.id });
      getTrial.mockResolvedValue(expiredAppTrial);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: trialExpiredSpace,
      });

      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
    });

    it('does not render when the App Trial is expired and the navbar is OrgSettingsNavbar', async () => {
      isOrgRoute.mockReturnValue(true);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: trialExpiredSpace,
      });
      getTrial.mockResolvedValue(expiredAppTrial);

      build({ organizationId: organizationNotOnTrial.sys.id });

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render when both the App Trial and Trial Space are purchased', async () => {
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: spaceNotOnTrial(organizationNotOnTrial),
      });
      getTrial.mockResolvedValue(purchasedAppTrial);

      build();

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('renders when the Trial Space is purchased during the active App Trial', async () => {
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: spaceNotOnTrial(organizationNotOnTrial),
      });
      getTrial.mockResolvedValue(activeAppTrial);

      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
      expect(screen.queryByTestId('app_trial_tag-link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('does not render when the Trial Space is purchased after the App Trial expired', async () => {
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: spaceNotOnTrial(organizationNotOnTrial),
      });
      getTrial.mockResolvedValue(expiredAppTrial);

      build();

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });
  });
});
