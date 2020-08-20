import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { getVariation } from 'LaunchDarkly';
import { TrialTag } from './TrialTag';
import * as fake from 'test/helpers/fakeFactory';
import { getCurrentOrg } from 'core/utils/getCurrentOrg';
import { track } from 'analytics/Analytics';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { href } from 'states/Navigator';

const trialEndsAt = '2020-10-10';
const trialEndedAt = '2020-09-10';
const today = '2020-10-01T03:00:00.000Z';
const daysLeft = 9;

const mockOrganization = fake.Organization({
  pricingVersion: 'pricing_version_2',
  trialPeriodEndsAt: trialEndsAt,
});

const legacyOrganization = fake.Organization({
  pricingVersion: 'pricing_version_1',
  trialPeriodEndsAt: trialEndsAt,
});

const trialExpiredOrganization = fake.Organization({
  pricingVersion: 'pricing_version_2',
  trialPeriodEndsAt: trialEndedAt,
});

const neverOnTrialOrganization = fake.Organization({
  pricingVersion: 'pricing_version_2',
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

jest.mock('core/utils/getCurrentOrg', () => ({
  getCurrentOrg: jest.fn(async () => mockOrganization),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
}));

describe('TrialTag', () => {
  beforeEach(() => {
    getVariation.mockClear().mockResolvedValue(true);
    isOwnerOrAdmin.mockReturnValue(false);

    const now = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  it('does not render if the organization is legacy', async () => {
    getCurrentOrg.mockResolvedValueOnce(legacyOrganization);
    build();

    await waitFor(() => expect(getCurrentOrg).toBeCalled());
    await waitFor(() => expect(screen.queryByTestId('trial-tag')).not.toBeInTheDocument());
  });

  it('does not render if the feature flag is turned off', async () => {
    getVariation.mockResolvedValueOnce(false);
    build();

    await waitFor(() => expect(getVariation).toBeCalled());
    await waitFor(() => expect(screen.queryByTestId('trial-tag')).not.toBeInTheDocument());
  });

  it('renders when the organization is on platform trial', async () => {
    build();

    await waitFor(() =>
      expect(screen.getByTestId('trial-tag')).toHaveTextContent(`TRIAL - ${daysLeft} DAYS`)
    );
  });

  it('navigates to the subscription page when clicked', async () => {
    build();

    await waitFor(() => fireEvent.click(screen.queryByTestId('trial-tag-link')));
    await waitFor(() =>
      expect(href).toHaveBeenCalledWith({
        path: 'account.organizations.subscription_new',
        params: { orgId: mockOrganization.sys.id },
      })
    );
    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('trial:trial_tag_clicked', {
        type: 'platform',
        organization_id: mockOrganization.sys.id,
        numTrialDaysLeft: daysLeft,
        isOwnerOrAdmin: false,
      })
    );
  });

  it('does not render if the platform trial has ended', async () => {
    getCurrentOrg.mockResolvedValueOnce(trialExpiredOrganization);

    build();

    await waitFor(() => expect(screen.queryByTestId('trial-tag')).not.toBeInTheDocument());
  });

  it('does not render if the organization was never on platform trial', async () => {
    getCurrentOrg.mockResolvedValueOnce(neverOnTrialOrganization);

    build();

    await waitFor(() => expect(screen.queryByTestId('trial-tag')).not.toBeInTheDocument());
  });
});
