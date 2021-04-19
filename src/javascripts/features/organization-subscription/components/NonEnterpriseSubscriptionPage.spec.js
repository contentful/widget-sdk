import React from 'react';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import { FREE } from 'account/pricing/PricingDataProvider';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';

import { mockWebappContent } from './__mocks__/webappContent';
import { NonEnterpriseSubscriptionPage } from './NonEnterpriseSubscriptionPage';

jest.mock('core/services/ContentfulCDA', () => ({
  fetchWebappContentByEntryID: jest.fn((_entryId, _query) => Promise.resolve({})),
}));
jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

const mockOrganization = Fake.Organization();
const mockFreeBasePlan = Fake.Plan({ name: 'Community Platform', customerType: FREE });
const mockFreeSpacePlan = {
  name: 'Mock free space',
  planType: 'free_space',
  space: { sys: { id: 'test' } },
};

describe('NonEnterpriseSubscriptionPage', () => {
  beforeEach(() => {
    fetchWebappContentByEntryID.mockReset().mockResolvedValue(mockWebappContent);
  });
  afterEach(cleanup);

  describe('BasePlan section', () => {
    it('show the BasePlanCard initially loading', async () => {
      await build();

      const basePlanCard = screen.getByTestId('base-plan-card');
      const skeletons = within(basePlanCard).queryAllByTestId('cf-ui-skeleton-form');

      expect(basePlanCard).toBeVisible();
      skeletons.forEach((skeleton) => expect(skeleton).toBeVisible());
    });

    it('show the BasePlanCard with the fetched content', async () => {
      await build();

      const basePlanCard = screen.getByTestId('base-plan-card');

      expect(basePlanCard).toBeVisible();

      await waitFor(() => {
        expect(screen.getByTestId('base-plan-title')).toBeVisible();
      });
    });
  });

  describe('Monthly Total section', () => {
    it('should show the monthly cost for on demand users', async () => {
      await build({ organization: Fake.Organization({ isBillable: true }), grandTotal: 3000 });

      expect(screen.getByText('Monthly total')).toBeVisible();
      expect(screen.getByTestId('on-demand-monthly-cost')).toHaveTextContent('$3,000');
    });
  });

  describe('Contentful Apps section', () => {
    it('shows Contentful Apps trial card for users who have not purchased apps', async () => {
      await build({ isAppTrialActive: true });

      expect(screen.getByTestId('apps-trial-header')).toBeVisible();
      expect(screen.queryByTestId('apps-header')).toBeNull();
    });

    it('shows Contentful Apps card for users who have purchased apps', async () => {
      await build({
        addOnPlan: { sys: { id: 'addon_id' } },
        composeAndLaunchEnabled: true,
      });

      expect(screen.getByTestId('apps-header')).toBeVisible();
      expect(screen.queryByTestId('apps-trial-header')).toBeNull();
    });
  });

  describe('Spaces section', () => {
    it('shows the space plans’ table', async () => {
      await build();

      const spacesTable = screen.getByTestId('subscription-page.table');
      expect(spacesTable).toBeVisible();
    });
  });
});

async function build(custom) {
  const props = Object.assign(
    {
      initialLoad: false,
      organization: mockOrganization,
      basePlan: mockFreeBasePlan,
      spacePlans: [mockFreeSpacePlan],
      grandTotal: null,
      usersMeta: null,
      onSpacePlansChange: null,
    },
    custom
  );

  render(<NonEnterpriseSubscriptionPage {...props} />);

  await waitFor(() => {
    expect(fetchWebappContentByEntryID).toHaveBeenCalled();
  });
}
