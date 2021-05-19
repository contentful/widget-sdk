import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as trackCTA from 'analytics/trackCTA';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { setUser } from 'services/OrganizationRoles';
import { EVENTS } from '../../utils/analyticsTracking';
import { SpacePlanSelectionStep, FEATURE_OVERVIEW_HREF } from './SpacePlanSelectionStep';
import { SpacePlanKind } from '../../utils/spacePurchaseContent';
import { canUserCreatePaidSpace, canOrgCreateFreeSpace } from '../../utils/canCreateSpace';
import { renderWithProvider } from '../../__tests__/helpers';

const mockOrganization = FakeFactory.Organization();
const mockSpace = FakeFactory.Space();
const mockOrgOwner = FakeFactory.User({
  organizationMemberships: [{ organization: mockOrganization, role: 'owner' }],
});
const mockProductRatePlan = FakeFactory.Plan();
const mockProductRatePlan2 = FakeFactory.Plan();
const mockFreeSpaceResource = FakeFactory.SpaceResource();

jest.mock('../../utils/canCreateSpace', () => ({
  canUserCreatePaidSpace: jest.fn(),
  canOrgCreateFreeSpace: jest.fn(),
}));

const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');

describe('SpacePlanSelectionStep', () => {
  beforeEach(() => {
    setUser(mockOrgOwner);
    canUserCreatePaidSpace.mockReturnValue(true);
    canOrgCreateFreeSpace.mockReturnValue(true);
  });

  it('should show a heading', async () => {
    await build();

    expect(screen.getByTestId('space-selection.heading')).toBeVisible();
  });

  it('should show all three space cards', async () => {
    await build();

    expect(screen.getAllByTestId('space-card')).toHaveLength(3);
  });

  it('should show the loading state when there are no space rate plans', async () => {
    await build(null, {
      spaceRatePlans: null,
    });

    expect(screen.getByTestId('space-rate-plans-loading')).toBeVisible();
    expect(screen.getByTestId('free-space-loading')).toBeVisible();
  });

  it('should show the legacy space plan warning if the current space rate plan is not in the product rate plans', async () => {
    await build(null, {
      currentSpace: mockSpace,
      currentSpaceRatePlan: {
        productRatePlanId: 'something-else',
        ratePlanCharges: [],
      },
    });

    expect(screen.getByTestId('legacy-space-plan-warning')).toBeVisible();
  });

  it('should NOT show the legacy space plan warning if the current space rate plan is a community plan', async () => {
    await build(null, {
      currentSpace: mockSpace,
      currentSpaceRatePlan: {
        name: SpacePlanKind.COMMUNITY,
        productRatePlanId: 'something-else',
        ratePlanCharges: [],
      },
    });

    expect(screen.queryByTestId('legacy-space-plan-warning')).toBeNull();
  });

  it('should disable the paid space cards if the user cannot create paid spaces', async () => {
    canUserCreatePaidSpace.mockReturnValue(false);
    await build();

    const spaceCards = screen.getAllByTestId('space-card');

    for (const spaceCard of spaceCards) {
      expect(within(spaceCard).getByTestId('select-space-cta')).toHaveAttribute('disabled');
    }
  });

  it('should show the payment details note if the user cannot create paid spaces', async () => {
    canUserCreatePaidSpace.mockReturnValue(false);
    await build();

    expect(screen.getByTestId('payment-details-required')).toBeVisible();
  });

  it('should show the community card', async () => {
    await build();

    expect(screen.getByTestId('space-selection.community-card')).toBeVisible();
  });

  it('should show the feature overview link and log when it is clicked', async () => {
    const track = jest.fn();

    await build({ track });

    const featureOverviewLink = screen.getByTestId('space-selection.feature-overview-link');
    expect(featureOverviewLink).toBeVisible();

    userEvent.click(featureOverviewLink);

    expect(track).toHaveBeenCalledWith(EVENTS.EXTERNAL_LINK_CLICKED, {
      href: FEATURE_OVERVIEW_HREF,
      intent: 'feature_overview',
    });
  });

  it('should track the click and open the sales form in a new tab when the enterprise select button is clicked', async () => {
    const track = jest.fn();

    await build({ track });

    userEvent.click(screen.getAllByTestId('select-space-cta')[2]);

    expect(track).toHaveBeenCalledWith(EVENTS.EXTERNAL_LINK_CLICKED, {
      href: 'https://www.contentful.com/contact/sales/?utm_medium=webapp&utm_source=purchase-space-page&utm_campaign=cta-enterprise-space&utm_content=contact-us',
      intent: 'upgrade_to_enterprise',
    });

    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      organizationId: mockOrganization.sys.id,
    });
  });

  it('should call onSubmit when the medium or large space is selected', async () => {
    const onSubmit = jest.fn();

    await build({ onSubmit });

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    expect(onSubmit).toBeCalled();
  });

  it('should enable the community plan button if the user can create a free space', async () => {
    await build();

    const communitySelectButton = screen.getByTestId('space-selection-community-select-button');

    expect(communitySelectButton).toHaveProperty('disabled', false);
  });

  it('should disable the community plan button if there are no more free spaces available', async () => {
    canOrgCreateFreeSpace.mockReturnValue(false);
    await build();

    const communitySelectButton = screen.getByTestId('space-selection-community-select-button');

    expect(communitySelectButton).toHaveProperty('disabled', true);
  });

  it('should call onSubmit when the free plan is clicked', async () => {
    const onSubmit = jest.fn();

    await build({ onSubmit });

    userEvent.click(screen.getByTestId('space-selection-community-select-button'));

    expect(onSubmit).toBeCalled();
  });
});

async function build(customProps, customState) {
  const props = {
    onSubmit: () => {},
    track: () => {},
    ...customProps,
  };

  await renderWithProvider(
    SpacePlanSelectionStep,
    {
      organization: mockOrganization,
      spaceRatePlans: [mockProductRatePlan, mockProductRatePlan2],
      freeSpaceResource: mockFreeSpaceResource,
      sessionId: 'random_id',
      ...customState,
    },
    props
  );
}
