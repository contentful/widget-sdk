import React from 'react';
import { render, screen, wait, fireEvent, within } from '@testing-library/react';
import SpacePlanRow from './SpacePlanRow';
import { go } from 'states/Navigator';
import { getEnabledFeatures } from 'utils/SubscriptionUtils';

import * as fake from 'test/helpers/fakeFactory';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';

const MOCK_USER_NAME = 'John Doe';
const SPACE_NAME = 'SPACE_NAME';
const MOCK_CREATED_AT_TIME_DAY_MONTH_YEAR = fake.CREATED_AT_TIME_DAY_MONTH_YEAR;
const MOCK_EXPIRES_AT_DAY_MONTH_YEAR = '01/01/2020';

const mockBasePlan = fake.Plan();
const mockPlan = {
  sys: { id: 'random_id' },
  name: SPACE_NAME,
  planType: 'free_space',
  space: fake.Space(),
  price: 1337,
};

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('utils/SubscriptionUtils', () => ({
  getEnabledFeatures: jest.fn().mockImplementation(() => {
    return [];
  }),
}));

jest.mock('moment', () => {
  const fn = jest.fn(() => ({
    format: jest.fn(() => MOCK_EXPIRES_AT_DAY_MONTH_YEAR),
  }));

  fn.utc = jest.fn(() => {
    return {
      format: jest.fn(() => {
        return MOCK_CREATED_AT_TIME_DAY_MONTH_YEAR;
      }),
    };
  });
  return fn;
});

const mockOnChangeSpace = jest.fn();
const mockOnDeleteSpace = jest.fn();

describe('Space Plan Row', () => {
  describe('should display basic plan information', () => {
    it('should display the name of the plan', async () => {
      await build();
      expect(screen.getByTestId('subscription-page.spaces-list.space-name')).toHaveTextContent(
        mockPlan.space.name
      );
    });

    it('should display the space type of the plan', async () => {
      await build();
      expect(screen.getByTestId('subscription-page.spaces-list.space-type')).toHaveTextContent(
        SPACE_NAME
      );
    });

    it('should call onChangeSpace when upgrade-space-link is clicked', async () => {
      await build();
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.upgrade-plan-link'));

      expect(mockOnChangeSpace).toHaveBeenCalled();
    });

    it('should display the user who created', async () => {
      await build();
      expect(screen.getByTestId('subscription-page.spaces-list.created-by')).toHaveTextContent(
        MOCK_USER_NAME
      );
    });

    it('should display the date it was created on', async () => {
      await build();
      expect(screen.getByTestId('subscription-page.spaces-list.created-on')).toHaveTextContent(
        MOCK_CREATED_AT_TIME_DAY_MONTH_YEAR
      );
    });

    it('should not show change-plan-link if showSpacePlanChangeBtn is false', async () => {
      await build({ showSpacePlanChangeBtn: false });
      expect(screen.queryByTestId('subscription-page.spaces-list.change-plan-link')).toBeNull();
    });

    it('should display the expiry date column if showExpiresAtColumn is true and feature flag is on', async () => {
      await build({ showExpiresAtColumn: true, isTrialCommEnabled: true });
      expect(screen.getByTestId('subscription-page.spaces-list.expires-at')).toHaveTextContent(
        MOCK_EXPIRES_AT_DAY_MONTH_YEAR
      );
    });

    it('should not display the expiry date column if showExpiresAtColumn is false and feature flag is on', async () => {
      await build({ showExpiresAtColumn: false, isTrialCommEnabled: true });
      expect(screen.queryByTestId('subscription-page.spaces-list.expires-at')).toBeNull();
    });
  });

  describe('render variations', () => {
    it("hides the price when it's an enterprise plan", async () => {
      await build({ enterprisePlan: true });

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.plan-price');
      }).toThrow();
    });

    it('shows price when not an enterprise plan', async () => {
      await build();

      expect(screen.getByTestId('subscription-page.spaces-list.plan-price')).toBeDefined();
    });

    it('hides the enterprise tooltip when plan is not committed', async () => {
      await build();

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.enterprise-tooltip');
      }).toThrow();
    });

    it('shows the enterprise tooltip when plan is committed', async () => {
      await build({ committed: true });

      fireEvent.mouseOver(
        screen.getByTestId('subscription-page.spaces-list.enterprise-tooltip-trigger')
      );
      expect(screen.getByTestId('subscription-page.spaces-list.enterprise-tooltip')).toBeDefined();
    });

    it('hides the feature tooltips when the plan does not have enabled features', async () => {
      await build();

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.features-tooltip-trigger');
      }).toThrow();
    });

    it('shows the feature tooltip(s) when the plan has enabled features', async () => {
      // 'FakeFeature1' is just filler text for the array so it has a length more than 0
      getEnabledFeatures.mockImplementation(() => {
        return ['FakeFeature1'];
      });
      await build();

      fireEvent.mouseOver(
        screen.getByTestId('subscription-page.spaces-list.features-tooltip-trigger')
      );

      expect(screen.getByTestId('subscription-page.spaces-list.features-tooltip')).toBeDefined();
    });

    it('shows the PoC tooltip when the space is an existing POC and feature flag is on', async () => {
      await build({ isTrialCommEnabled: true, createdAsPOC: true });

      fireEvent.mouseOver(screen.getByTestId('subscription-page.spaces-list.poc-tooltip-trigger'));

      expect(screen.getByTestId('subscription-page.spaces-list.poc-tooltip')).toBeDefined();
    });

    it('does not show the feature tooltip when the PoC tooltip is present', async () => {
      getEnabledFeatures.mockImplementation(() => {
        return ['FakeFeature1'];
      });
      await build({ isTrialCommEnabled: true, createdAsPOC: true });

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.features-tooltip-trigger');
      }).toThrow();
    });

    it('does not show the PoC tooltip when the feature flag is off', async () => {
      await build({ isTrialCommEnabled: false });
      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.poc-tooltip-trigger');
      }).toThrow();
    });

    it('does not have special className when not upgraded', async () => {
      await build({ hasUpgraded: false });

      // The class 'x--success' comes from the SpacePlanRow.js file
      expect(
        screen
          .getByTestId('subscription-page.spaces-list.table-row')
          .classList.contains('x--success')
      ).toBeFalsy();
    });

    it('has upgraded className when upgraded', async () => {
      await build({ hasUpgraded: true });

      // The class 'hasUpgraded' comes from the SpacePlanRow.js file
      expect(
        screen
          .getByTestId('subscription-page.spaces-list.table-row')
          .className.includes('hasUpgraded')
      ).toBeTruthy();
    });
  });

  describe('drop down menu options', () => {
    it('should stay hidden when not clicked', async () => {
      await build();

      expect(() => {
        screen.getByTestId('cf-ui-card-actions-container');
      }).toThrow();
    });

    it('should drop down when clicked', async () => {
      await build();
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));

      expect(screen.getByTestId('cf-ui-card-actions-container')).toBeDefined();
    });

    it('should call onChangeSpace when change-space-link is clicked', async () => {
      await build({ enterprisePlan: true });
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.change-space-link'));

      expect(mockOnChangeSpace).toHaveBeenCalled();
    });

    it('the view space button should be disabled when it is not accessible', async () => {
      await build();
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));

      const spaceLinkButtonContainer = screen.getByTestId(
        'subscription-page.spaces-list.space-link'
      );
      const spaceLinkButton = within(spaceLinkButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );

      expect(spaceLinkButton.hasAttribute('disabled')).toBeTruthy();
    });

    it('the view space-usage button should be disabled when it is not accessible', async () => {
      await build();
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));

      const spaceUsageLinkButtonContainer = screen.getByTestId(
        'subscription-page.spaces-list.space-usage-link'
      );
      const spaceUsageLinkButton = within(spaceUsageLinkButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );

      expect(spaceUsageLinkButton.hasAttribute('disabled')).toBeTruthy();
    });

    it('should navigate to space when space-link is clicked', async () => {
      await build({ basePlan: mockBasePlan, plan: mockPlan, isAccessible: true });
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));

      const spaceLinkButtonContainer = screen.getByTestId(
        'subscription-page.spaces-list.space-link'
      );
      fireEvent.click(
        within(spaceLinkButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(go).toHaveBeenCalledWith({
        path: ['spaces', 'detail', 'home'],
        params: { spaceId: mockPlan.space.sys.id },
        options: { reload: true },
      });
    });

    it('should navigate to space-usage when space-usage-link is clicked', async () => {
      await build();
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      const spaceUsageLinkButtonContainer = screen.getByTestId(
        'subscription-page.spaces-list.space-usage-link'
      );
      fireEvent.click(
        within(spaceUsageLinkButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );

      expect(go).toHaveBeenCalledWith({
        path: ['spaces', 'detail', 'settings', 'usage'],
        params: { spaceId: mockPlan.space.sys.id },
        options: { reload: true },
      });
    });

    it('should call onDeleteSpace when delete-space-link is clicked', async () => {
      await build();
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.delete-space-link'));

      expect(mockOnDeleteSpace).toHaveBeenCalled();
    });
  });
});

function build(input = {}) {
  const options = {
    plan: mockPlan,
    isAccessible: false,
    committed: false,
    hasUpgraded: false,
    enterprisePlan: false,
    showSpacePlanChangeBtn: false,
    ...input,
  };

  if (options.isAccessible) {
    options.plan.space.isAccessible = true;
  }

  if (options.committed) {
    options.plan.committed = true;
  }

  if (options.showExpiresAtColumn) {
    options.plan.space.expiresAt = '2020-01-01';
  }

  if (options.createdAsPOC) {
    options.plan.space.createdAsPOC = true;
  }

  render(
    <table>
      <tbody>
        <SpacePlanRow
          plan={options.plan}
          onChangeSpace={mockOnChangeSpace}
          onDeleteSpace={mockOnDeleteSpace}
          hasUpgraded={options.hasUpgraded}
          enterprisePlan={options.enterprisePlan}
          showSpacePlanChangeBtn={options.showSpacePlanChangeBtn}
          showExpiresAtColumn={options.showExpiresAtColumn}
          isTrialCommEnabled={options.isTrialCommEnabled}
        />
      </tbody>
    </table>
  );

  // the component makes requests on mount.
  // wait until there are changes as effect of the calls.
  return wait();
}
