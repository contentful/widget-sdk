import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import { getVariation } from 'LaunchDarkly';

import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { EnterpriseSubscriptionPage } from './EnterpriseSubscriptionPage';

import * as trackCTA from 'analytics/trackCTA';

import { beginSpaceCreation } from 'services/CreateSpace';

jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('../utils', () => ({
  links: {
    billing: jest.fn(),
    memberships: jest.fn().mockReturnValue({ path: 'not-important-path' }),
  },
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
  getCurrentStateName: jest.fn(),
}));

const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');

const mockOrganization = Fake.Organization();
const mockTrialOrganization = Fake.Organization({
  trialPeriodEndsAt: new Date(),
});

const mockBasePlan = Fake.Plan({ name: 'My cool base plan' });

describe('EnterpriseSubscriptionPage', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    getVariation.mockClear().mockResolvedValue(false);
    isOwnerOrAdmin.mockReturnValue(true);
  });

  it('should show skeletons when initialLoad is true', () => {
    build({ initialLoad: true });

    screen.getAllByTestId('cf-ui-skeleton-form').forEach((ele) => {
      expect(ele).toBeVisible();
    });
  });

  it('should track a click and open the CreateSpaceModal when onCreateSpace is clicked', () => {
    build();

    userEvent.click(screen.getByTestId('subscription-page.create-space'));
    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.CREATE_SPACE, {
      organizationId: mockOrganization.sys.id,
    });
    expect(beginSpaceCreation).toBeCalledWith(mockOrganization.sys.id);
  });

  describe('organization on platform trial', () => {
    beforeEach(() => {
      isOwnerOrAdmin.mockReturnValue(true);
    });

    it('should show trial info for admins and owners', () => {
      build({
        organization: mockTrialOrganization,
      });

      expect(screen.getByTestId('platform-trial-info')).toBeVisible();
    });

    it('should show trial info and spaces section for members', () => {
      isOwnerOrAdmin.mockReturnValueOnce(false);
      build({
        organization: mockTrialOrganization,
        memberAccessibleSpaces: [],
      });

      expect(screen.getByTestId('platform-trial-info')).toBeVisible();
      expect(screen.getByTestId('subscription-page-trial-members.heading')).toBeVisible();
      expect(
        screen.getByTestId('subscription-page-trial-members.no-spaces-placeholder')
      ).toBeVisible();
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      initialLoad: false,
      organization: mockOrganization,
      basePlan: mockBasePlan,
      spacePlans: [],
      grandTotal: null,
      usersMeta: null,
      onSpacePlansChange: null,
    },
    custom
  );

  render(<EnterpriseSubscriptionPage {...props} />);
}
