import React from 'react';
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { router } from 'core/react-routing';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';

import { SpacePlanRow } from './SpacePlanRow';
import {
  TRIAL_SPACE_FREE_SPACE_PLAN_NAME,
  SELF_SERVICE,
} from 'account/pricing/PricingDataProvider';

const TODAY = '2019-10-01T03:00:00.000Z';
const YESTERDAY = '2019-09-30T03:00:00.000Z';

const mockUsage = {
  limit: 10,
  usage: 1,
  utilization: 1 / 10,
};

const mockSpaceUsage = {
  environments: mockUsage,
  locales: mockUsage,
  contentTypes: mockUsage,
  records: mockUsage,
  roles: mockUsage,
  sys: { id: 'random_id' },
};

const mockSelfServicePlan = {
  sys: { id: 'random_id' },
  name: SELF_SERVICE,
  planType: 'free_space',
  space: fake.Space(),
  price: 1337,
  usage: mockSpaceUsage,
};

const mockTrialPlan = {
  sys: { id: 'random_id' },
  name: TRIAL_SPACE_FREE_SPACE_PLAN_NAME,
  planType: 'free_space',
  space: fake.Space(),
  price: 1337,
  usage: { ...mockSpaceUsage, spaceTrialPeriodEndsAt: TODAY },
};

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
}));

jest.mock('core/react-routing', () => ({
  router: {
    navigate: jest.fn(),
  },
}));

const mockOnChangeSpace = jest.fn();
const mockOnDeleteSpace = jest.fn();

function build(customProps = {}) {
  const props = {
    enterprisePlan: false,
    hasUpgraded: false,
    onChangeSpace: mockOnChangeSpace,
    onDeleteSpace: mockOnDeleteSpace,
    organizationId: 'orgId',
    plan: mockTrialPlan,
    showSpacePlanChangeBtn: false,
    ...customProps,
  };

  if (customProps.isAccessible !== undefined) {
    props.plan.space.isAccessible = customProps.isAccessible;
  }

  if (customProps.expiresAt) {
    props.plan.usage.spaceTrialPeriodEndsAt = customProps.expiresAt;
  }

  render(
    <table>
      <tbody>
        <SpacePlanRow {...props} />
      </tbody>
    </table>
  );
}

describe('Space Plan Row', () => {
  beforeEach(() => {
    const now = new Date(TODAY).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });
  describe('should display basic plan information', () => {
    it('should display the name of the space', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.space-name')).toHaveTextContent(
        mockTrialPlan.space.name
      );
    });

    it('should display the space type of the plan', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.space-type')).toHaveTextContent(
        TRIAL_SPACE_FREE_SPACE_PLAN_NAME
      );
    });

    it('should call onChangeSpace when upgrade-space-link is clicked', async () => {
      build();

      await act(async () => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.upgrade-plan-link'));
      });

      expect(mockOnChangeSpace).toHaveBeenCalled();
    });

    it('should display space environments usage', () => {
      build();
      expect(
        screen.getByTestId('subscription-page.spaces-list.usage.environments')
      ).toHaveTextContent(`${mockUsage.usage}/${mockUsage.limit}`);
    });

    it('should display space locales usage', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.usage.locales')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
    });

    it('should display space records usage', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.usage.records')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
    });

    it('should display space roles usage', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.usage.roles')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
    });

    it('should display space content types usage', () => {
      build();
      expect(
        screen.getByTestId('subscription-page.spaces-list.usage.content-types')
      ).toHaveTextContent(`${mockUsage.usage}/${mockUsage.limit}`);
    });

    it('should not show change-plan-link if showSpacePlanChangeBtn is false', () => {
      build({ showSpacePlanChangeBtn: false });
      expect(screen.queryByTestId('subscription-page.spaces-list.change-plan-link')).toBeNull();
    });

    it('should navigate to space when space-link is clicked', async () => {
      build({ isAccessible: true });

      await act(async () => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.space-link'));
      });

      expect(go).toHaveBeenCalledWith({
        path: 'spaces.detail',
        params: { spaceId: mockTrialPlan.space.sys.id },
      });
    });
  });

  describe('render variations', () => {
    it('does not show the space name link if the space is not accessible', () => {
      build({ isAccessible: false });
      expect(() => screen.getByTestId('subscription-page.spaces-list.space-link')).toThrow();
    });

    it('hides the price when it`s an enterprise plan', () => {
      build({ enterprisePlan: true });

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.plan-price');
      }).toThrow();
    });

    it('shows price when not an enterprise plan', () => {
      build();

      expect(screen.getByTestId('subscription-page.spaces-list.plan-price')).toBeDefined();
    });

    it('shows the trial space tooltip when the trial space is on an active trial', async () => {
      build({ expiresAt: TODAY });

      await act(async () => {
        fireEvent.mouseOver(
          screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip-trigger')
        );
      });
      expect(
        screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip')
      ).toHaveTextContent('Expires');
    });

    it('shows the trial space tooltip when the trial is expired', async () => {
      build({ expiresAt: YESTERDAY });

      await act(async () => {
        fireEvent.mouseOver(
          screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip-trigger')
        );
      });
      expect(
        screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip')
      ).toHaveTextContent('Expired');
    });

    it('does not show the trial space tooltip when it is not a Trial Space', () => {
      build({ plan: mockSelfServicePlan });

      expect(() =>
        screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip-trigger')
      ).toThrow();
    });

    it('has successful-upgrade styling when upgraded', () => {
      build({ hasUpgraded: true });

      // The class 'hasUpgraded' comes from the SpacePlanRow.js file
      expect(
        screen
          .getByTestId('subscription-page.spaces-list.table-row')
          .className.includes('hasUpgraded')
      ).toBeTruthy();
    });
  });

  describe('drop down menu options', () => {
    it('should call onChangeSpace when change-space-link is clicked', async () => {
      build();

      const dropdownButton = screen.getByTestId(
        'subscription-page.spaces-list.dropdown-menu.trigger'
      );
      fireEvent.click(dropdownButton);

      await waitFor(() => {
        const changeSpaceButtonContainer = screen.getByTestId(
          'subscription-page.spaces-list.change-space-link'
        );
        fireEvent.click(changeSpaceButtonContainer);
      });

      expect(mockOnChangeSpace).toHaveBeenCalled();
    });

    it('the view space-usage button should be disabled when it is not accessible', async () => {
      build({ isAccessible: false });

      const dropdownButton = screen.getByTestId(
        'subscription-page.spaces-list.dropdown-menu.trigger'
      );
      fireEvent.click(dropdownButton);

      await waitFor(() => {
        const spaceUsageLinkButtonContainer = screen.getByTestId(
          'subscription-page.spaces-list.space-usage-link'
        );
        const spaceUsageLinkButton = within(spaceUsageLinkButtonContainer).getByTestId(
          FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
        );
        expect(spaceUsageLinkButton.hasAttribute('disabled')).toBeTruthy();
      });
    });

    it('should navigate to space-usage when space-usage-link is clicked', async () => {
      build({ isAccessible: true });

      const dropdownButton = screen.getByTestId(
        'subscription-page.spaces-list.dropdown-menu.trigger'
      );
      fireEvent.click(dropdownButton);

      await waitFor(() => {
        const spaceUsageLinkButtonContainer = screen.getByTestId(
          'subscription-page.spaces-list.space-usage-link'
        );
        fireEvent.click(
          within(spaceUsageLinkButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
        );
      });

      expect(router.navigate).toHaveBeenCalledWith({
        path: 'usage',
        spaceId: mockTrialPlan.space.sys.id,
      });
    });

    it('should call onDeleteSpace when delete-space-link is clicked', async () => {
      build();

      const dropdownButton = screen.getByTestId(
        'subscription-page.spaces-list.dropdown-menu.trigger'
      );
      fireEvent.click(dropdownButton);

      await waitFor(() => {
        const deleteButtonContainer = screen.getByTestId(
          'subscription-page.spaces-list.delete-space-link'
        );
        fireEvent.click(
          within(deleteButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
        );
      });

      expect(mockOnDeleteSpace).toHaveBeenCalled();
    });
  });
});
