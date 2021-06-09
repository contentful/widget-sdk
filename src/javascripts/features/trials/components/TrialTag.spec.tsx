import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { TrialTag, TrialTagProps } from './TrialTag';
import * as fake from 'test/helpers/fakeFactory';
import { getOrganization as _getOrganization } from 'services/TokenStore';
import { track } from 'analytics/Analytics';
import { isOwnerOrAdmin as _isOwnerOrAdmin } from 'services/OrganizationRoles';
import { href, isOrgRoute as _isOrgRoute } from 'states/Navigator';
import { useAppsTrial as _useAppsTrial } from '../hooks/useAppsTrial';
import { useTrialSpace as _useTrialSpace } from '../hooks/useTrialSpace';
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

const space = fake.Space();

const readOnlyTrialSpace = fake.Space({ readOnlyAt });

const getMockSpaceWithOrg = (organization: unknown) =>
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

jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn().mockReturnValue({}),
}));

jest.mock('../hooks/useAppsTrial', () => ({
  useAppsTrial: jest.fn().mockReturnValue({}),
}));

jest.mock('../hooks/useTrialSpace', () => ({
  useTrialSpace: jest.fn().mockReturnValue({}),
}));

jest.mock('../utils/utils', () => ({
  ...(jest.requireActual('../utils/utils') as Record<string, unknown>),
  isSpaceAccessible: jest.fn().mockResolvedValue(true),
}));

const getOrganization = _getOrganization as jest.Mock;
const isOrgRoute = _isOrgRoute as jest.Mock;
const isOwnerOrAdmin = _isOwnerOrAdmin as jest.Mock;
const useSpaceEnvContext = _useSpaceEnvContext as jest.Mock;
const useAppsTrial = _useAppsTrial as jest.Mock;
const useTrialSpace = _useTrialSpace as jest.Mock;
const isSpaceAccessible = _isSpaceAccessible as jest.Mock;

describe('TrialTag', () => {
  beforeEach(() => {
    isOwnerOrAdmin.mockReturnValue(false);
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
        path: 'account.organizations',
        params: {
          navigationState: null,
          pathname: `/${trialOrganization.sys.id}/subscription_overview`,
        },
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
      const mockSpace = getMockSpaceWithOrg(trialOrganization);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: mockSpace,
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
        currentSpaceData: space,
      });
      useTrialSpace.mockReturnValue({
        isActiveTrialSpace: true,
        trialSpaceExpiresAt: trialEndsAt,
      });
    });

    it('renders when the space is on trial and the navbar is SpaceNavbar', async () => {
      build();

      await waitFor(() => expect(screen.getByTestId('trial_space_tag')).toHaveTextContent('TRIAL'));
    });

    it('renders when the trial has ended', async () => {
      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: true,
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
        currentSpaceData: readOnlyTrialSpace,
      });

      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: true,
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
        params: { spaceId: space.sys.id, navigationState: null, pathname: '/' },
      });

      expect(track).toHaveBeenCalledWith('trial:trial_tag_clicked', {
        type: 'trial_space_tag',
        numTrialDaysLeft: daysLeft,
        isOwnerOrAdmin: false,
      });
    });

    it('does not render if neither the space nor organization is on trial', async () => {
      useTrialSpace.mockReturnValue({
        isActiveTrialSpace: false,
      });

      build();

      await waitFor(() => screen.queryByTestId('trial_space_tag'));
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render when the space is on trial but the navbar is OrgSettingsNavbar', async () => {
      isOrgRoute.mockReturnValue(true);
      getOrganization.mockReturnValue(organizationNotOnTrial);
      useTrialSpace.mockReturnValue({});

      build({ organizationId: organizationNotOnTrial.sys.id });

      await waitFor(() => screen.queryByTestId('space-trial-tag'));
      expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument();
    });

    it('renders when only the Trial App is purchased and the Trial Space becomes expired', async () => {
      useAppsTrial.mockReturnValue({
        hasAppsTrialExpired: true,
      });

      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: true,
        matchesAppsTrialSpaceKey: true,
      });

      build();

      await waitFor(() => screen.getByTestId('app_trial_tag'));
      expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL');
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });
  });

  describe('Apps trial', () => {
    beforeEach(() => {
      isOrgRoute.mockReturnValue(false);
      useSpaceEnvContext.mockReturnValue({
        currentSpaceData: space,
      });
      useAppsTrial.mockReturnValue({
        isAppsTrialActive: true,
        appsTrialSpaceKey: space.sys.id,
        appsTrialEndsAt: trialEndsAt,
      });
      useTrialSpace.mockReturnValue({
        isActiveTrialSpace: true,
        matchesAppsTrialSpaceKey: true,
      });
      getOrganization.mockResolvedValue(organizationNotOnTrial);
    });

    it('renders when the Apps Trial is active and the navbar is OrgSettingsNavbar', async () => {
      isOrgRoute.mockReturnValue(true);
      useTrialSpace.mockReturnValue({});
      build({ organizationId: organizationNotOnTrial.sys.id });

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
    });

    it('navigates to the App Trial Space Home when clicked', async () => {
      build();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await waitFor(() => fireEvent.click(screen.queryByTestId('app_trial_tag-link')!));

      expect(href).toHaveBeenCalledWith({
        path: 'spaces.detail.home',
        params: { spaceId: space.sys.id, navigationState: null, pathname: '/' },
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

    it('renders when the Apps Trial is active and the navbar is SpaceNavbar', async () => {
      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
    });

    it('renders when the Apps Trial has expired on the Apps Trial Space', async () => {
      useAppsTrial.mockReturnValue({
        hasAppsTrialExpired: true,
      });
      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: true,
        matchesAppsTrialSpaceKey: true,
      });

      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
    });

    it('does not render on upgraded Apps Trial Spaces when the Apps Trial has expired', async () => {
      useAppsTrial.mockReturnValue({
        hasAppsTrialExpired: true,
      });
      useTrialSpace.mockReturnValue({
        hasTrialSpaceConverted: true,
        matchesAppsTrialSpaceKey: true,
      });

      build();

      await waitFor(() => expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument());
    });

    it('does not render when the App Trial is expired and the navbar is OrgSettingsNavbar', async () => {
      isOrgRoute.mockReturnValue(true);
      useAppsTrial.mockReturnValue({
        hasAppsTrialExpired: true,
      });
      useTrialSpace.mockReturnValue({});

      build({ organizationId: organizationNotOnTrial.sys.id });

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render when both the App Trial and Trial Space are purchased', async () => {
      useAppsTrial.mockReturnValue({
        hasAppsTrialExpired: true,
      });
      useTrialSpace.mockReturnValue({
        hasTrialSpaceConverted: true,
        matchesAppsTrialSpaceKey: true,
      });

      build();

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('renders when the Trial Space is purchased during the active App Trial', async () => {
      useAppsTrial.mockReturnValue({
        isAppsTrialActive: true,
      });
      useTrialSpace.mockReturnValue({
        hasTrialSpaceConverted: true,
        matchesAppsTrialSpaceKey: true,
      });

      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent('TRIAL'));
      expect(screen.queryByTestId('app_trial_tag-link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });
  });
});
