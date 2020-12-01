import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { go } from 'states/Navigator';

import * as fake from 'test/helpers/fakeFactory';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';
import { SpacePlanRowNew } from './SpacePlanRowNew';
import {
  TRIAL_SPACE_FREE_SPACE_PLAN_NAME,
  SELF_SERVICE,
} from 'account/pricing/PricingDataProvider';

const TODAY = '2019-10-01T03:00:00.000Z';
const YESTERDAY = '2019-09-30T03:00:00.000Z';

const mockTrialPlan = {
  sys: { id: 'random_id' },
  name: TRIAL_SPACE_FREE_SPACE_PLAN_NAME,
  planType: 'free_space',
  space: fake.Space(),
  price: 1337,
};

const mockSelfServicePlan = {
  sys: { id: 'random_id' },
  name: SELF_SERVICE,
  planType: 'free_space',
  space: fake.Space(),
  price: 1337,
};

const mockUsage = {
  limit: 10,
  usage: 1,
};
const mockSpaceUsage = {
  environments: mockUsage,
  locales: mockUsage,
  contentTypes: mockUsage,
  records: mockUsage,
  roles: mockUsage,
  sys: { id: 'random_id' },
};

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
}));

const mockOnChangeSpace = jest.fn();
const mockOnDeleteSpace = jest.fn();

const build = (input = {}) => {
  const options = {
    plan: mockTrialPlan,
    spaceUsage: mockSpaceUsage,
    hasUpgraded: false,
    enterprisePlan: false,
    showSpacePlanChangeBtn: false,
    ...input,
  };

  if ('isAccessible' in input) {
    options.plan.space.isAccessible = options.isAccessible;
  } else {
    options.plan.space.isAccessible = true;
  }

  if ('expiresAt' in options) {
    options.plan.space.expiresAt = options.expiresAt;
  } else {
    delete options.plan.space.expiresAt;
  }

  render(
    <table>
      <tbody>
        <SpacePlanRowNew
          plan={options.plan}
          spaceUsage={options.spaceUsage}
          onChangeSpace={mockOnChangeSpace}
          onDeleteSpace={mockOnDeleteSpace}
          hasUpgraded={options.hasUpgraded}
          enterprisePlan={options.enterprisePlan}
          showSpacePlanChangeBtn={options.showSpacePlanChangeBtn}
        />
      </tbody>
    </table>
  );
};

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
      expect(screen.getByTestId('subscription-page.spaces-list.environments')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
    });

    it('should display space locales usage', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.locales')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
    });

    it('should display space records usage', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.records')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
    });

    it('should display space roles usage', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.roles')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
    });

    it('should display space content types usage', () => {
      build();
      expect(screen.getByTestId('subscription-page.spaces-list.content-types')).toHaveTextContent(
        `${mockUsage.usage}/${mockUsage.limit}`
      );
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

    it('shows the trial space tooltip when the trial space is not accessible', async () => {
      build({ isAccessible: false, expiresAt: undefined });

      await act(async () => {
        fireEvent.mouseOver(
          screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip-trigger')
        );
      });

      expect(
        screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip')
      ).not.toHaveTextContent('Expire');
    });

    it('does not show the trial space tooltip when it is not a Trial Space', () => {
      build({ plan: mockSelfServicePlan });

      expect(() =>
        screen.getByTestId('subscription-page.spaces-list.trial-space-tooltip-trigger')
      ).toThrow();
    });

    it('does not have successful-upgrade styling when not upgraded', () => {
      build({ hasUpgraded: false });

      // The class 'x--success' comes from the SpacePlanRow.js file
      expect(
        screen
          .getByTestId('subscription-page.spaces-list.table-row')
          .classList.contains('x--success')
      ).toBeFalsy();
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
      build({ enterprisePlan: true });

      await act(async () => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.change-space-link'));
      });

      expect(mockOnChangeSpace).toHaveBeenCalled();
    });

    it('the view space-usage button should be disabled when it is not accessible', async () => {
      build({ isAccessible: false });
      await act(async () => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      });

      const spaceUsageLinkButtonContainer = screen.getByTestId(
        'subscription-page.spaces-list.space-usage-link'
      );
      const spaceUsageLinkButton = within(spaceUsageLinkButtonContainer).getByTestId(
        FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID
      );

      expect(spaceUsageLinkButton.hasAttribute('disabled')).toBeTruthy();
    });

    it('should navigate to space-usage when space-usage-link is clicked', async () => {
      build({ isAccessible: true });

      await act(async () => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      });

      const spaceUsageLinkButtonContainer = screen.getByTestId(
        'subscription-page.spaces-list.space-usage-link'
      );

      await act(async () => {
        fireEvent.click(
          within(spaceUsageLinkButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
        );
      });

      expect(go).toHaveBeenCalledWith({
        path: ['spaces', 'detail', 'settings', 'usage'],
        params: { spaceId: mockTrialPlan.space.sys.id },
      });
    });

    it('should call onDeleteSpace when delete-space-link is clicked', async () => {
      build();

      await act(async () => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.dropdown-menu.trigger'));
      });

      await act(() => {
        fireEvent.click(screen.getByTestId('subscription-page.spaces-list.delete-space-link'));
      });

      expect(mockOnDeleteSpace).toHaveBeenCalled();
    });
  });
});
