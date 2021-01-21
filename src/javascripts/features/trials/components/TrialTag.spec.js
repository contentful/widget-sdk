import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { TrialTag } from './TrialTag';
import * as fake from 'test/helpers/fakeFactory';
import { getOrganization, getSpace } from 'services/TokenStore';
import { track } from 'analytics/Analytics';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { href, isOrgRoute, isSpaceRoute } from 'states/Navigator';
import * as spaceContext from 'classes/spaceContext';

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

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
  getCurrentStateName: jest.fn(),
  isOrgRoute: jest.fn(),
  isSpaceRoute: jest.fn(),
}));

describe('TrialTag', () => {
  beforeEach(() => {
    getOrganization.mockResolvedValue(trialOrganization);
    getSpace.mockResolvedValue(trialSpace);
    isOrgRoute.mockReturnValue(true);
    isSpaceRoute.mockReturnValue(false);

    const mockedNow = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => mockedNow);
  });

  it('does not render the trial tag if AccountSettingNavbar or ErrorNavbar', async () => {
    isOrgRoute.mockReturnValue(false);
    isSpaceRoute.mockReturnValue(false);

    build();

    await waitFor(() => expect(screen.queryByTestId('platform-trial-tag')).not.toBeInTheDocument());
    expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument();
  });

  describe('Platform trial', () => {
    beforeEach(() => {
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        orgId: trialOrganization.sys.id,
      }));
      isOwnerOrAdmin.mockReturnValue(false);
    });

    it('renders when the organization is on trial and the navbar is OrgSettingsNavbar', async () => {
      build();

      await waitFor(() =>
        expect(screen.getByTestId('platform-trial-tag')).toHaveTextContent(
          `TRIAL - ${daysLeft} DAYS`
        )
      );
    });

    it('navigates to the subscription page when clicked', async () => {
      build();

      await waitFor(() => fireEvent.click(screen.queryByTestId('platform-trial-tag-link')));

      expect(href).toHaveBeenCalledWith({
        path: 'account.organizations.subscription_new',
        params: { orgId: trialOrganization.sys.id },
      });

      expect(track).toHaveBeenCalledWith('trial:trial_tag_clicked', {
        type: 'platform',
        numTrialDaysLeft: daysLeft,
        isOwnerOrAdmin: false,
      });
    });

    it('does not render if the trial has ended', async () => {
      getOrganization.mockResolvedValue(trialExpiredOrganization);
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        orgId: trialExpiredOrganization.sys.id,
      }));
      build();

      await waitFor(() =>
        expect(screen.queryByTestId('platform-trial-tag')).not.toBeInTheDocument()
      );
    });

    it('does not render if the organization is not on trial', async () => {
      getOrganization.mockResolvedValue(organizationNotOnTrial);
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        orgId: organizationNotOnTrial.sys.id,
      }));
      build();

      await waitFor(() =>
        expect(screen.queryByTestId('platform-trial-tag')).not.toBeInTheDocument()
      );
    });

    it('renders when the organization is on trial and the navbar is SpaceNavbar', async () => {
      const space = spaceNotOnTrial(trialOrganization);
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        spaceId: space.sys.id,
      }));
      getSpace.mockResolvedValue(space);
      isOrgRoute.mockReturnValue(false);
      isSpaceRoute.mockReturnValue(true);
      build();

      await waitFor(() => expect(screen.getByTestId('platform-trial-tag')).toBeInTheDocument());
    });
  });

  describe('Space trial', () => {
    beforeEach(() => {
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        spaceId: trialSpace.sys.id,
      }));
      isOwnerOrAdmin.mockReturnValue(false);
      isOrgRoute.mockReturnValue(false);
      isSpaceRoute.mockReturnValue(true);
    });

    it('renders when the space is on trial and the navbar is SpaceNavbar', async () => {
      build();

      await waitFor(() =>
        expect(screen.getByTestId('space-trial-tag')).toHaveTextContent(`TRIAL - ${daysLeft} DAYS`)
      );
    });

    it('renders when the trial has ended', async () => {
      getSpace.mockResolvedValue(trialExpiredSpace);
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        spaceId: trialExpiredSpace.sys.id,
      }));

      build();

      await waitFor(() =>
        expect(screen.queryByTestId('space-trial-tag')).toHaveTextContent('TRIAL - EXPIRED')
      );
    });

    it('does not render when the active trial space becomes read-only', async () => {
      getSpace.mockResolvedValue(readOnlyTrialSpace);
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        spaceId: readOnlyTrialSpace.sys.id,
      }));

      build();

      await waitFor(() => expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument());
    });

    it('does not render when the expired trial space becomes read-only', async () => {
      getSpace.mockResolvedValue(readOnlyExpiredTrialSpace);
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        spaceId: readOnlyExpiredTrialSpace.sys.id,
      }));

      build();

      await waitFor(() => expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument());
    });

    it('navigates to the space home when clicked', async () => {
      build();

      await waitFor(() => fireEvent.click(screen.queryByTestId('space-trial-tag-link')));
      expect(href).toHaveBeenCalledWith({
        path: 'spaces.detail.home',
        params: { orgId: organizationNotOnTrial.sys.id, spaceId: trialSpace.sys.id },
      });

      expect(track).toHaveBeenCalledWith('trial:trial_tag_clicked', {
        type: 'space',
        numTrialDaysLeft: daysLeft,
        isOwnerOrAdmin: false,
      });
    });

    it('does not render if neither the space nor organization is on trial', async () => {
      const mockSpace = spaceNotOnTrial(organizationNotOnTrial);
      getSpace.mockResolvedValue(mockSpace);
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        spaceId: mockSpace.sys.id,
      }));

      build();

      await waitFor(() => expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument());
      expect(screen.queryByTestId('platform-trial-tag')).not.toBeInTheDocument();
    });

    it('does not render when the space is on trial but the navbar is OrgSettingsNavbar', async () => {
      jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
        spaceId: organizationNotOnTrial.sys.id,
      }));
      isOrgRoute.mockReturnValue(true);
      isSpaceRoute.mockReturnValue(false);

      build();

      await waitFor(() => expect(screen.queryByTestId('space-trial-tag')).not.toBeInTheDocument());
    });
  });
});
