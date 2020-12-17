import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as fake from 'test/helpers/fakeFactory';

import { SpacePlans } from './SpacePlans';
import { getSpacesUsage } from '../services/SpacesUsageService';

const fakeSpaceId = 'fake_space_id';
const mockSpaceForPlanOne = fake.Space({ sys: { id: fakeSpaceId } });
const mockSpaceForPlanTwo = fake.Space();

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
  space: mockSpaceForPlanTwo,
  price: 456,
};

const mockPlans = [mockPlanOne, mockPlanTwo];

const mockUsage = {
  usage: 100,
  limit: 100,
  utilization: 1,
};

const mockSpaceUsage = {
  contentTypes: mockUsage,
  environments: mockUsage,
  records: mockUsage,
  locales: mockUsage,
  roles: mockUsage,
  sys: {
    id: '123',
    space: {
      sys: {
        id: fakeSpaceId,
      },
    },
  },
};

jest.mock('utils/SubscriptionUtils', () => ({
  calculatePlansCost: jest.fn().mockReturnValue(123),
  getEnabledFeatures: jest.fn().mockImplementation(() => {
    return [];
  }),
}));

jest.mock('../services/SpacesUsageService', () => ({
  getSpacesUsage: jest.fn().mockResolvedValue({ items: [], total: 0 }),
}));

const mockOnChangeSpace = jest.fn();
const mockOnDeleteSpace = jest.fn();
const mockOnCreateSpace = jest.fn();

describe('Space Plan', () => {
  describe('should load correctly', () => {
    it('should not display the export btn while loading', async () => {
      build({ initialLoad: true });

      await waitFor(() => expect(screen.queryByTestId('subscription-page.export-csv')).toBeNull());
    });
  });

  describe('should render correctly', () => {
    it('should display the number of spaces an organization has', async () => {
      build();
      await waitFor(() =>
        expect(screen.getByTestId('subscription-page.organization-information')).toHaveTextContent(
          'Your organization has 2 spaces.'
        )
      );
    });

    it('should say if an organization has 0 spaces', async () => {
      build({ spacePlans: [] });
      await waitFor(() =>
        expect(screen.getByTestId('subscription-page.organization-information')).toHaveTextContent(
          "Your organization doesn't have any spaces."
        )
      );
    });

    it('should display the total cost of the spaces in non-enterprise organizations.', async () => {
      build();
      await waitFor(() =>
        expect(
          screen.getByTestId('subscription-page.non-enterprise-price-information')
        ).toHaveTextContent('The total for your spaces is $123 per month')
      );
    });

    it('should not display the total cost of the spaces in an enterprise organization.', async () => {
      build({ enterprisePlan: true });
      await waitFor(() =>
        expect(
          screen.queryByTestId('subscription-page.non-enterprise-price-information')
        ).toBeNull()
      );
    });

    it('should call onCreateSpace when the create-space button is clicked', async () => {
      const onCreateSpace = jest.fn();

      build({ onCreateSpace });
      userEvent.click(screen.getByTestId('subscription-page.create-space'));

      await waitFor(() => expect(onCreateSpace).toHaveBeenCalled());
    });

    it('should render SpacePlanRows when there are plans', async () => {
      getSpacesUsage.mockResolvedValue({ items: [mockSpaceUsage], total: 1 });
      build();
      await waitFor(() =>
        expect(screen.queryAllByTestId('subscription-page.spaces-list.table-row')).toHaveLength(1)
      );
    });

    it('should not render SpacePlanRows when there are no plans', async () => {
      build({ spacePlans: [] });
      await waitFor(() =>
        expect(screen.queryAllByTestId('subscription-page.spaces-list.table-row')).toHaveLength(0)
      );
    });

    it('should render an upgraded SpacePlanRow when it has been upgraded', async () => {
      getSpacesUsage.mockResolvedValue({ items: [mockSpaceUsage], total: 1 });
      build({ upgradedSpaceId: mockSpaceForPlanOne.sys.id });

      await waitFor(() =>
        expect(
          screen
            .queryAllByTestId('subscription-page.spaces-list.table-row')[0]
            .className.includes('hasUpgraded')
        ).toBeTrue()
      );
    });

    it('should render a help icon and tooltip when anySpacesInaccessible is true', async () => {
      build({ anySpacesInaccessible: true });

      const helpIcon = screen.getByTestId('inaccessible-help-icon');

      expect(helpIcon).toBeVisible();
      expect(screen.queryByTestId('inaccessible-help-tooltip')).toBeNull();

      fireEvent.mouseEnter(helpIcon);

      await waitFor(() => expect(screen.getByTestId('inaccessible-help-tooltip')).toBeVisible());
    });

    it('should display 2 tabs for enterprise organization if there are plans unassigned.', async () => {
      const mockPlanLocalOne = {
        sys: { id: 'random_id_1' },
        name: 'random_name_1',
        gatekeeperKey: null,
        planType: 'space',
        space: null,
        price: 789,
      };
      const mockPlanLocalTwo = {
        sys: { id: 'random_id_2' },
        name: 'random_name_2',
        gatekeeperKey: 'randomKey',
        planType: 'space',
        space: fake.Space(),
        price: 456,
      };

      const mockedPlansLocal = [mockPlanLocalOne, mockPlanLocalTwo];

      build({
        enterprisePlan: true,
        spacePlans: mockedPlansLocal,
        initialLoad: false,
        isOwnerOrAdmin: true,
      });

      await waitFor(() => expect(screen.getByTestId('tab-usedSpaces')).toBeInTheDocument());
      expect(screen.queryByTestId('tab-unusedSpaces')).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      fireEvent.click(screen.getByTestId('tab-unusedSpaces'));
      expect(screen.getByTestId('subscription-page.unassigned-plans-table')).toBeVisible();
      expect(
        screen.queryAllByTestId('subscription-page.spaces-list.unassigned-plans-table-row')
      ).toHaveLength(1);
    });

    it('should display 1 tab for enterprise organization if there are no plans unassigned.', async () => {
      getSpacesUsage.mockResolvedValue({ items: [mockSpaceUsage], total: 1 });

      build({
        enterprisePlan: true,
        initialLoad: false,
        isOwnerOrAdmin: true,
      });

      await waitFor(() => expect(screen.getByTestId('tab-usedSpaces')).toBeInTheDocument());
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(1);

      expect(screen.getByTestId('subscription-page.table')).toBeVisible();
      expect(screen.queryAllByTestId('subscription-page.spaces-list.table-row')).toHaveLength(1);
    });

    it('should display the export btn', async () => {
      build();

      await waitFor(() =>
        expect(screen.getByTestId('subscription-page.export-csv')).toBeInTheDocument()
      );
    });

    it('should not display the export btn if there are no assigned spaces', async () => {
      const mockUnAssignedSpacePlan = {
        sys: { id: 'random_id_1' },
        name: 'random_name_1',
        gatekeeperKey: null,
        planType: 'space',
        space: null,
        price: 789,
      };
      build({ spacePlans: [mockUnAssignedSpacePlan] });

      await waitFor(() => expect(screen.queryByTestId('subscription-page.export-csv')).toBeNull());
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      initialLoad: false,
      spacePlans: mockPlans,
      upgradedSpaceId: 'string',
      onCreateSpace: mockOnCreateSpace,
      onChangeSpace: mockOnChangeSpace,
      onDeleteSpace: mockOnDeleteSpace,
      enterprisePlan: false,
      organizationId: '123',
      anySpacesInaccessible: false,
    },
    custom
  );

  render(<SpacePlans {...props} />);
}
