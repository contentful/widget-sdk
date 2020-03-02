import React from 'react';
import { render, screen, wait, fireEvent, within } from '@testing-library/react';
import SpacePlanRow from './SpacePlanRow';
import { go } from 'states/Navigator';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { getEnabledFeatures } from 'utils/SubscriptionUtils';

import * as fake from 'testHelpers/fakeFactory';
import * as FORMA_CONSTANTS from 'testHelpers/Forma36Constants';

const MOCK_USER_NAME = 'John Doe';
const SPACE_NAME = 'SPACE_NAME';
const MOCK_CREATED_AT_TIME_DAY_MONTH_YEAR = fake.CREATED_AT_TIME_DAY_MONTH_YEAR;

const mockBasePlan = fake.BasePlan();
const mockPlan = {
  sys: { id: 'random_id' },
  name: SPACE_NAME,
  planType: 'free_space',
  space: fake.Space(),
  price: 1337
};

jest.mock('states/Navigator', () => ({
  go: jest.fn()
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn()
}));

isEnterprisePlan.mockImplementation(() => {
  return true;
});

jest.mock('utils/SubscriptionUtils', () => ({
  getEnabledFeatures: jest.fn().mockImplementation(() => {
    return false;
  })
}));

jest.mock('moment', () => ({
  utc: jest.fn(() => {
    return {
      format: jest.fn(() => {
        return MOCK_CREATED_AT_TIME_DAY_MONTH_YEAR;
      })
    };
  })
}));

const mockOnChangeSpace = jest.fn();
const mockOnDeleteSpace = jest.fn();

describe('Space Plan Row', () => {
  describe('should display basic plan information', () => {
    it('should display the name of the plan', async () => {
      await build();
      expect(screen.getByTestId('subscription-page.spaces-list.space-name')).toHaveTextContent(
        mockPlan.space.sys.id
      );
    });

    it('should display the space type of the plan', async () => {
      await build();
      expect(screen.getByTestId('subscription-page.spaces-list.space-type')).toHaveTextContent(
        SPACE_NAME
      );
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
  });

  describe('render variations', () => {
    it('hides the price when an enterprise plan', async () => {
      isEnterprisePlan.mockImplementation(() => {
        return true;
      });
      await build();

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.plan-price');
      }).toThrow();
    });

    it('shows price when not an enterprise plan', async () => {
      isEnterprisePlan.mockImplementation(() => {
        return false;
      });
      await build();

      expect(screen.getByTestId('subscription-page.spaces-list.plan-price')).toBeDefined();
    });

    it('hides the enterprise tooltip when plan is not committed', async () => {
      await build();

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.enterprise-toolitp');
      }).toThrow();
    });

    it('shows the enterprise tooltip when plan is committed', async () => {
      await build({ committed: true });

      fireEvent.mouseOver(
        screen.getByTestId('subscription-page.spaces-list.enterprise-toolitp-trigger')
      );
      expect(screen.getByTestId('subscription-page.spaces-list.enterprise-toolitp')).toBeDefined();
    });

    it('hides the feature tooltips when the plan does not have enabled features', async () => {
      await build();

      expect(() => {
        screen.getByTestId('subscription-page.spaces-list.features-toolitp-trigger');
      }).toThrow();
    });

    it('shows the feature tooltip(s) when the plan has enabled features', async () => {
      // 'FakeFeature1' is just filler text for the array so it has a length more than 0
      getEnabledFeatures.mockImplementation(() => {
        return ['FakeFeature1'];
      });
      await build();

      fireEvent.mouseOver(
        screen.getByTestId('subscription-page.spaces-list.features-toolitp-trigger')
      );

      expect(screen.getByTestId('subscription-page.spaces-list.features-toolitp')).toBeDefined();
    });

    it('does not have special className when not upgraded', async () => {
      await build({ upgraded: false });

      // The class 'x--success' comes from the SpacePlanRow.js file
      expect(
        screen
          .getByTestId('subscription-page.spaces-list.table-row')
          .classList.contains('x--success')
      ).toBeFalsy();
    });

    it('has upgraded className when upgraded', async () => {
      await build({ upgraded: true });

      // The class 'x--success' comes from the SpacePlanRow.js file
      expect(
        screen
          .getByTestId('subscription-page.spaces-list.table-row')
          .classList.contains('x--success')
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

    it('should call onChangeSpace when change-space-link is clicked', async () => {
      await build();
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      fireEvent.click(screen.getByTestId('subscription-page.spaces-list.change-space-link'));

      expect(mockOnChangeSpace).toHaveBeenCalled();
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
        options: { reload: true }
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
        options: { reload: true }
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
  const options = Object.assign(
    { plan: mockPlan, isAccessible: false, upgraded: false, committed: false },
    input
  );

  if (options.isAccessible) {
    options.plan.space.isAccessible = true;
  }

  if (options.committed) {
    options.plan.committed = true;
  }

  render(
    <SpacePlanRow
      basePlan={mockBasePlan}
      plan={options.plan}
      onChangeSpace={mockOnChangeSpace}
      onDeleteSpace={mockOnDeleteSpace}
      upgraded={options.upgraded}
    />
  );

  // the component makes requests on mount.
  // wait until there are changes as effect of the calls.
  return wait();
}
