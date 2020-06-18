import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpacePlans from './SpacePlans';

import * as fake from 'test/helpers/fakeFactory';

const mockSpaceForPlanOne = fake.Space();
const mockPlanOne = {
  sys: { id: 'random_id_1' },
  name: 'random_name_1',
  planType: 'free_space',
  space: mockSpaceForPlanOne,
  price: 789,
};
const mockPlanTwo = {
  sys: { id: 'random_id_2' },
  name: 'random_name_2',
  planType: 'free_space',
  space: fake.Space(),
  price: 456,
};

const mockPlans = [mockPlanOne, mockPlanTwo];

jest.mock('utils/SubscriptionUtils', () => ({
  calculatePlansCost: jest.fn().mockReturnValue(123),
  getEnabledFeatures: jest.fn().mockImplementation(() => {
    return [];
  }),
}));
const mockOnChangeSpace = jest.fn();
const mockOnDeleteSpace = jest.fn();
const mockOnCreateSpace = jest.fn();

describe('Space Plan', () => {
  describe('should load correctly', () => {
    it('should display the skelton template while loading', () => {
      build({ initialLoad: true });

      screen.getAllByTestId('cf-ui-skeleton-form').forEach((ele) => expect(ele).toBeVisible());
    });

    it('should not display the skelton template after loading', () => {
      build();

      expect(screen.queryAllByTestId('cf-ui-skeleton-form')).toEqual([]);
    });
  });

  describe('should render correctly', () => {
    it('should display the number of spaces an organization has', () => {
      build();
      expect(screen.getByTestId('subscription-page.organization-information')).toHaveTextContent(
        'Your organization has 2 spaces.'
      );
    });

    it('should say if an organization has 0 spaces', () => {
      build({ spacePlans: [] });
      expect(screen.getByTestId('subscription-page.organization-information')).toHaveTextContent(
        "Your organization doesn't have any spaces."
      );
    });

    it('should display the total cost of the spaces in non-enterprise organizations.', () => {
      build();
      expect(
        screen.getByTestId('subscription-page.non-enterprise-price-information')
      ).toHaveTextContent('The total for your spaces is $123 per month');
    });

    it('should not display the total cost of the spaces in an enterprise organization.', () => {
      build({ enterprisePlan: true });
      expect(screen.queryByTestId('subscription-page.non-enterprise-price-information')).toBeNull();
    });

    it('should call onCreateSpace when the create-space button is clicked', () => {
      const onCreateSpace = jest.fn();

      build({ onCreateSpace });
      userEvent.click(screen.getByTestId('subscription-page.create-space'));

      expect(onCreateSpace).toHaveBeenCalled();
    });

    it('should render SpacePlanRows when there are plans', () => {
      build();
      expect(screen.queryAllByTestId('subscription-page.spaces-list.table-row')).toHaveLength(2);
    });

    it('should not render SpacePlanRows when there are no plans', () => {
      build({ spacePlans: [] });
      expect(screen.queryAllByTestId('subscription-page.spaces-list.table-row')).toHaveLength(0);
    });

    it('should render an upgraded SpacePlanRow when it has been upgraded', () => {
      build({ upgradedSpaceId: mockSpaceForPlanOne.sys.id });

      expect(
        screen
          .queryAllByTestId('subscription-page.spaces-list.table-row')[0]
          .className.includes('hasUpgraded')
      ).toBeTrue();
    });

    it('should not render a support card when showMicroSmallSupportCard is false', () => {
      build();

      expect(screen.queryByTestId('subscription-page.support-request-card')).toBeNull();
    });

    it('should render a support card when showMicroSmallSupportCard is true', () => {
      build({ showMicroSmallSupportCard: true });

      expect(screen.getByTestId('subscription-page.support-request-card')).toBeVisible();

      expect(
        screen.getByTestId('subscription-page.support-request-link').getAttribute('href')
      ).toContain(
        'support/?utm_source=webapp&utm_medium=account-menu&utm_campaign=in-app-help&purchase-micro-or-small-space=123'
      );
      expect(
        screen.getByTestId('subscription-page.pricing-information-link').getAttribute('href')
      ).toContain('pricing/');
    });
  });
});

function build(input = {}) {
  const options = {
    initialLoad: false,
    spacePlans: mockPlans,
    upgradedSpaceId: 'string',
    onCreateSpace: mockOnCreateSpace,
    onChangeSpace: mockOnChangeSpace,
    onDeleteSpace: mockOnDeleteSpace,
    enterprisePlan: false,
    organizationId: '123',
    showMicroSmallSupportCard: false,
    ...input,
  };

  render(
    <SpacePlans
      initialLoad={options.initialLoad}
      spacePlans={options.spacePlans}
      upgradedSpaceId={options.upgradedSpaceId}
      onCreateSpace={options.onCreateSpace}
      onChangeSpace={options.onChangeSpace}
      onDeleteSpace={options.onDeleteSpace}
      enterprisePlan={options.enterprisePlan}
      organizationId={options.organizationId}
      showMicroSmallSupportCard={options.showMicroSmallSupportCard}
    />
  );
}