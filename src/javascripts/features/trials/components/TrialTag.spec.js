import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { TrialTag } from './TrialTag';
import * as fake from 'test/helpers/fakeFactory';
import { getOrganization, getSpace } from 'services/TokenStore';
import { track } from 'analytics/Analytics';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { href, isOrgRoute, isSpaceRoute } from 'states/Navigator';
import { getVariation } from 'LaunchDarkly';
import { getAppTrialSpaceKey } from '../services/AppTrialService';
import { getTrial } from '../services/AppTrialRepo';

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
  readOnlyAt: readOnlyAt,
};

const readOnlyExpiredTrialSpace = {
  ...trialExpiredSpace,
  readOnlyAt: readOnlyAt,
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

const spaceNotOnTrial = (organization) =>
  fake.Space({
    organization,
  });

const build = () => {
  render(<TrialTag />);
};

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(),
  getSpace: jest.fn(),
}));

jest.mock('core/NgRegistry', () => ({
  getModule: jest.fn().mockReturnValue({ orgId: 'something', spaceId: 'something' }),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
  getCurrentStateName: jest.fn(),
  isOrgRoute: jest.fn(),
  isSpaceRoute: jest.fn(),
}));

jest.mock('../services/AppTrialService', () => ({
  ...jest.requireActual('../services/AppTrialService'),
  getAppTrialSpaceKey: jest.fn(),
}));

jest.mock('../services/AppTrialRepo', () => ({
  getTrial: jest.fn(),
}));

describe('TrialTag', () => {
  beforeEach(() => {
    getOrganization.mockResolvedValue(trialOrganization);
    getSpace.mockResolvedValue(trialSpace);
    isOrgRoute.mockReturnValue(true);
    isSpaceRoute.mockReturnValue(false);
    getVariation.mockResolvedValue(false);

    const mockedNow = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => mockedNow);
  });

  it('does not render the trial tag if AccountSettingNavbar or ErrorNavbar', async () => {
    isOrgRoute.mockReturnValue(false);
    isSpaceRoute.mockReturnValue(false);

    build();

    await waitFor(() => screen.queryByTestId('enterprise_trial_tag'));
    expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
  });

  describe('Enterprise trial', () => {
    beforeEach(() => {
      isOwnerOrAdmin.mockReturnValue(false);
    });

    it('renders when the organization is on trial and the navbar is OrgSettingsNavbar', async () => {
      build();

      await waitFor(() =>
        expect(screen.getByTestId('enterprise_trial_tag')).toHaveTextContent(`TRIAL`)
      );
      fireEvent.mouseOver(screen.getByTestId('enterprise_trial_tag-link'));
      await waitFor(() =>
        expect(screen.getByTestId('trial_tag-tooltip')).toHaveTextContent(`${daysLeft} DAYS`)
      );
    });

    it('navigates to the subscription page when clicked', async () => {
      build();

      await waitFor(() => fireEvent.click(screen.queryByTestId('enterprise_trial_tag-link')));

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
      build();

      await waitFor(() => screen.queryByTestId('enterprise_trial_tag'));
      expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render if the organization is not on trial', async () => {
      getOrganization.mockResolvedValue(organizationNotOnTrial);
      build();

      await waitFor(() => screen.queryByTestId('enterprise_trial_tag'));
      expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    });

    it('renders when the organization is on trial and the navbar is SpaceNavbar', async () => {
      const space = spaceNotOnTrial(trialOrganization);
      getSpace.mockResolvedValue(space);
      isOrgRoute.mockReturnValue(false);
      isSpaceRoute.mockReturnValue(true);
      build();

      await waitFor(() => expect(screen.getByTestId('enterprise_trial_tag')).toBeInTheDocument());
    });
  });

  describe('Space trial', () => {
    beforeEach(() => {
      isOwnerOrAdmin.mockReturnValue(false);
      isOrgRoute.mockReturnValue(false);
      isSpaceRoute.mockReturnValue(true);
    });

    it('renders when the space is on trial and the navbar is SpaceNavbar', async () => {
      build();

      await waitFor(() => expect(screen.getByTestId('trial_space_tag')).toHaveTextContent(`TRIAL`));
    });

    it('renders when the trial has ended', async () => {
      getSpace.mockResolvedValue(trialExpiredSpace);

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
      getSpace.mockResolvedValue(readOnlyTrialSpace);

      build();

      await waitFor(() => screen.queryByTestId('trial_space_tag'));
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('does not render when the expired trial space becomes read-only', async () => {
      getSpace.mockResolvedValue(readOnlyExpiredTrialSpace);

      build();

      await waitFor(() => screen.queryByTestId('trial_space_tag'));
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('navigates to the space home when clicked', async () => {
      build();

      await waitFor(() => fireEvent.click(screen.queryByTestId('trial_space_tag-link')));
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
      getSpace.mockResolvedValue(mockSpace);

      build();

      await waitFor(() => screen.queryByTestId('trial_space_tag'));
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('enterprise_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render when the space is on trial but the navbar is OrgSettingsNavbar', async () => {
      isOrgRoute.mockReturnValue(true);
      isSpaceRoute.mockReturnValue(false);

      build();

      await waitFor(() => screen.queryByTestId('space-trial-tag'));
      expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument();
    });

    it('renders when only the Trial App is purchased and the Trial Space becomes expired', async () => {
      getSpace.mockResolvedValue(trialExpiredSpace);
      getTrial.mockResolvedValue(purchasedAppTrial);
      getAppTrialSpaceKey.mockResolvedValue(trialExpiredSpace.sys.id);

      build();

      await waitFor(() => screen.getByTestId('trial_space_tag'));
      expect(screen.getByTestId('trial_space_tag')).toHaveTextContent(`TRIAL`);
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
    });
  });

  describe('App trial', () => {
    beforeEach(() => {
      getVariation.mockResolvedValue(true);
      isOwnerOrAdmin.mockReturnValue(false);
      getSpace.mockResolvedValue(trialSpace);
      isSpaceRoute.mockReturnValue(true);
      isOrgRoute.mockReturnValue(false);
      getTrial.mockResolvedValue(activeAppTrial);
      getOrganization.mockResolvedValue(organizationNotOnTrial);
      getAppTrialSpaceKey.mockResolvedValue(trialSpace.sys.id);
    });

    it('does not fetch the app feature when the feature flag is off', async () => {
      getVariation.mockResolvedValue(false);

      build();

      await waitFor(() => expect(getTrial).toHaveBeenCalledTimes(0));
      expect(getAppTrialSpaceKey).toHaveBeenCalledTimes(0);
    });

    it('renders when the App Trial is active and the navbar is OrgSettingsNavbar', async () => {
      isSpaceRoute.mockReturnValue(false);
      isOrgRoute.mockReturnValue(true);
      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent(`TRIAL`));
    });

    it('navigates to the App Trial Space Home when clicked', async () => {
      build();

      await waitFor(() => fireEvent.click(screen.queryByTestId('app_trial_tag-link')));

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
      getAppTrialSpaceKey.mockResolvedValue(null);

      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent(`TRIAL`));
      expect(screen.queryByTestId('app_trial_tag-link')).not.toBeInTheDocument();
    });

    it('renders when the App Trial is active and the navbar is SpaceNavbar', async () => {
      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent(`TRIAL`));
    });

    it('renders when the App Trial is expired and the navbar is SpaceNavbar', async () => {
      getTrial.mockResolvedValue(expiredAppTrial);
      getAppTrialSpaceKey.mockResolvedValue(trialExpiredSpace.sys.id);
      getSpace.mockResolvedValue(trialExpiredSpace);

      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent(`TRIAL`));
    });

    it('does not render when the App Trial is expired and the navbar is OrgSettingsNavbar', async () => {
      isSpaceRoute.mockReturnValue(false);
      isOrgRoute.mockReturnValue(true);
      getTrial.mockResolvedValue(expiredAppTrial);
      getAppTrialSpaceKey.mockResolvedValue(trialExpiredSpace.sys.id);

      build();

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
    });

    it('does not render when both the App Trial and Trial Space are purchased', async () => {
      getSpace.mockResolvedValue(spaceNotOnTrial(organizationNotOnTrial));
      getTrial.mockResolvedValue(purchasedAppTrial);

      build();

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('renders when the Trial Space is purchased during the active App Trial', async () => {
      getSpace.mockResolvedValue(spaceNotOnTrial(organizationNotOnTrial));
      getTrial.mockResolvedValue(activeAppTrial);
      getAppTrialSpaceKey.mockResolvedValue(null);

      build();

      await waitFor(() => expect(screen.getByTestId('app_trial_tag')).toHaveTextContent(`TRIAL`));
      expect(screen.queryByTestId('app_trial_tag-link')).not.toBeInTheDocument();

      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });

    it('does not render when the Trial Space is purchased after the App Trial expired', async () => {
      getSpace.mockResolvedValue(spaceNotOnTrial(organizationNotOnTrial));
      getTrial.mockResolvedValue(expiredAppTrial);
      getAppTrialSpaceKey.mockResolvedValue(null);

      build();

      await waitFor(() => screen.queryByTestId('app_trial_tag'));
      expect(screen.queryByTestId('app_trial_tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trial_space_tag')).not.toBeInTheDocument();
    });
  });
});
