import React from 'react';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import {
  FREE,
  SELF_SERVICE,
  PARTNER_PLATFORM_BASE_PLAN_NAME,
  PRO_BONO,
} from 'account/pricing/PricingDataProvider';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import { OrgSubscriptionContextProvider } from '../context';
import { mockWebappContent } from './__mocks__/webappContent';
import { BasePlanContentEntryIds } from '../types';
import { calculateSubscriptionCosts } from 'utils/SubscriptionUtils';
import { NonEnterpriseSubscriptionPage } from './NonEnterpriseSubscriptionPage';
import { MemoryRouter } from 'core/react-routing';

jest.mock('core/services/ContentfulCDA/fetchWebappContentByEntryID', () => ({
  fetchWebappContentByEntryID: jest.fn((_entryId, _query) => Promise.resolve({})),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('features/trials', () => ({
  useAppsTrial: jest.fn().mockReturnValue({}),
}));

jest.mock('utils/SubscriptionUtils', () => ({
  ...jest.requireActual('utils/SubscriptionUtils'),
  calculateSubscriptionCosts: jest.fn(),
}));

const mockOrganization = Fake.Organization();
const mockFreeBasePlan = Fake.Plan({ name: 'Community Platform', customerType: FREE });
const mockSelfServiceBasePlan = Fake.Plan({ name: 'Team Platform', customerType: SELF_SERVICE });
const mockProBonoBasePlan = Fake.Plan({ name: 'Pro Bono Platform', customerType: PRO_BONO });
const mockPartnerBasePlan = Fake.Plan({ name: PARTNER_PLATFORM_BASE_PLAN_NAME });
const mockFreeSpacePlan = {
  name: 'Mock free space',
  planType: 'free_space',
  space: { sys: { id: 'test' } },
};
const mockSubscriptionCosts = {
  lineItems: [{ name: 'First Item', price: 3000 }],
  total: 3000,
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

    it('fetches content for Community tier when basePlan.customerType is "Free"', async () => {
      await build();

      expect(fetchWebappContentByEntryID).toHaveBeenCalledWith(BasePlanContentEntryIds.FREE);
    });

    it('fetches content for Team tier when basePlan.customerType is "Self-service"', async () => {
      await build(null, { basePlan: mockSelfServiceBasePlan });

      expect(fetchWebappContentByEntryID).toHaveBeenCalledWith(
        BasePlanContentEntryIds.SELF_SERVICE
      );
    });

    it('fetches content for Partner Sandbox when basePlan.name is "Partner Platform"', async () => {
      await build(null, { basePlan: mockPartnerBasePlan });

      expect(fetchWebappContentByEntryID).toHaveBeenCalledWith(BasePlanContentEntryIds.PARTNER);
    });

    it('fetches content for Pro Bono when basePlan.customerType is "Marketing - NGO"', async () => {
      await build(null, { basePlan: mockProBonoBasePlan });

      expect(fetchWebappContentByEntryID).toHaveBeenCalledWith(BasePlanContentEntryIds.PRO_BONO);
    });
  });

  describe('Monthly Total section', () => {
    it('should show the monthly cost for on demand users', async () => {
      calculateSubscriptionCosts.mockReturnValue(mockSubscriptionCosts);
      await build({
        organization: Fake.Organization({ isBillable: true }),
      });

      expect(screen.getByTestId('monthly-total-card')).toBeVisible();

      const listItems = screen.getAllByTestId('subscription-page.monthly-total.list-item');
      // First line item in mock
      expect(listItems[0]).toHaveTextContent(
        `${mockSubscriptionCosts.lineItems[0].name}` + '$3,000'
      );
      // Last line is the total, no space between the two spans as they spaced apart with CSS
      expect(listItems[listItems.length - 1]).toHaveTextContent('Monthly total$3,000');
    });
  });

  describe('Contentful Apps section', () => {
    it('render Contentful Apps card for owners and admins', async () => {
      await build();

      expect(screen.getByTestId('contentful-apps-card')).toBeVisible();
    });

    it('does not render Contentful Apps card for members', async () => {
      isOwnerOrAdmin.mockReturnValue(false);
      await build();

      expect(screen.queryByTestId('contentful-apps-card')).toBeNull();
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

async function build(customProps, customState) {
  const props = {
    organization: mockOrganization,
    usersMeta: null,
    onSpacePlansChange: null,
    ...customProps,
  };

  const state = {
    spacePlans: [mockFreeSpacePlan],
    basePlan: mockFreeBasePlan,
    addOnPlans: [],
    numMemberships: 2,
    ...customState,
  };

  render(
    <MemoryRouter>
      <OrgSubscriptionContextProvider initialState={state}>
        <NonEnterpriseSubscriptionPage {...props} />
      </OrgSubscriptionContextProvider>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(fetchWebappContentByEntryID).toHaveBeenCalled();
  });
}
