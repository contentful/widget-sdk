import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as FakeFactory from 'test/helpers/fakeFactory';
import { EVENTS } from '../../utils/analyticsTracking';
import { renderWithProvider } from '../../__tests__/helpers';
import { PlatformSelectionStep, PACKAGES_COMPARISON_HREF } from './PlatformSelectionStep';
import { canUserCreatePaidSpace } from '../../utils/canCreateSpace';
import { PlatformKind, PLATFORM_CONTENT } from '../../utils/platformContent';

const mockTrack = jest.fn();
const mockOrganization = FakeFactory.Organization();

const mockComposeAndLaunchProductRatePlan = { price: 100 };
const mockSelectedPlatform = {
  ...PLATFORM_CONTENT.composePlatform,
  price: mockComposeAndLaunchProductRatePlan.price,
};

const mockComposeLaunchPlatform = { type: PlatformKind.SPACE_COMPOSE_LAUNCH };

const mockProductRatePlans = [
  { name: 'Community', price: 0 },
  { name: 'Medium', price: 489 },
  { name: 'Large', price: 889 },
];

jest.mock('../../utils/canCreateSpace', () => ({
  canUserCreatePaidSpace: jest.fn(),
  canOrgCreateFreeSpace: jest.fn().mockReturnValue(true),
}));

describe('PlatformSelectionStep', () => {
  it('should render a link to the package comparison page in the website', async () => {
    await build();

    const comparisonLink = screen.getByTestId('package-comparison-link');

    expect(comparisonLink).toBeVisible();
    expect(comparisonLink.textContent).toBe('See comparison of packages');
    expect(comparisonLink.getAttribute('href')).toBe(PACKAGES_COMPARISON_HREF);

    userEvent.click(comparisonLink);
    expect(mockTrack).toHaveBeenCalledWith(EVENTS.EXTERNAL_LINK_CLICKED, {
      href: PACKAGES_COMPARISON_HREF,
      intent: 'packages_comparison',
    });
  });

  describe('Platform cards', () => {
    beforeEach(() => {
      canUserCreatePaidSpace.mockReturnValue(true);
    });

    it('should render two platform cards', async () => {
      await build();
      const platformCards = screen.getAllByTestId('platform-card');
      expect(platformCards).toHaveLength(2);
      expect(within(platformCards[1]).getByTestId('product-price')).toBeDefined();
    });

    it('should disable the Compose+Launch platform card when the user cannot buy spaces', async () => {
      canUserCreatePaidSpace.mockReturnValue(false);

      await build();
      const platformCards = screen.getAllByTestId('platform-card');
      expect(platformCards[1].getAttribute('class')).toContain('disabled');
    });

    it('should select the card when clicked', async () => {
      await build();
      const platformCards = screen.getAllByTestId('platform-card');
      // eslint-disable-next-line no-undef
      const scrollIntoViewMock = jest.spyOn(HTMLElement.prototype, 'scrollIntoView');

      for (const platformCard of platformCards) {
        userEvent.click(platformCard);
        expect(platformCard.getAttribute('class')).toContain('--is-selected');
        expect(scrollIntoViewMock).toBeCalledWith({ behavior: 'smooth', block: 'start' });
      }
    });

    it('should track the click on a platform card', async () => {
      await build();
      const platformCards = screen.getAllByTestId('platform-card');

      userEvent.click(platformCards[0]);
      expect(mockTrack).toHaveBeenCalledWith(EVENTS.PLATFORM_SELECTED, {
        selectedPlatform: PLATFORM_CONTENT.spacePlatform,
      });

      userEvent.click(platformCards[1]);
      expect(mockTrack).toHaveBeenCalledWith(EVENTS.PLATFORM_SELECTED, {
        selectedPlatform: mockSelectedPlatform,
      });
    });
  });

  describe('Enterprise card', () => {
    let enterpriseCard;

    beforeEach(async () => {
      await build();
      enterpriseCard = screen.getByTestId('enterprise-card');
    });

    it('should render one Enterprise card', () => {
      expect(enterpriseCard).toBeVisible();
    });

    it('should have a "Talk to us" button', () => {
      const talkToUs = screen.getByTestId('enterprise-talk-to-us');
      expect(talkToUs).toBeVisible();
    });
  });

  describe('Space plan cards', () => {
    let spacePlanCards;

    beforeEach(async () => {
      await build(null, {
        selectedPlatform: mockComposeLaunchPlatform,
        spaceRatePlans: mockProductRatePlans,
        subscriptionPlans: mockProductRatePlans,
      });

      spacePlanCards = screen.getAllByTestId('space-plan-card');
    });

    it('should render three cards for the space plans', () => {
      expect(spacePlanCards).toHaveLength(3);

      for (const spacePlanCard of spacePlanCards) {
        expect(within(spacePlanCard).getByTestId('product-price')).toBeDefined();
      }
    });

    it('should select the card when user clicks on it', () => {
      spacePlanCards.forEach((spacePlanCard, i) => {
        userEvent.click(spacePlanCard);
        expect(spacePlanCard.getAttribute('class')).toContain('--is-selected');

        expect(mockTrack).toHaveBeenCalledWith(EVENTS.SPACE_PLAN_SELECTED, {
          selectedPlan: mockProductRatePlans[i],
        });
      });
    });
  });

  describe('Choose Space Later', () => {
    it('should allow users to choose space later if they select Compose+Launch AND have already a paid space in the org', () => {
      build(null, {
        selectedPlatform: mockSelectedPlatform,
        subscriptionPlans: mockProductRatePlans,
        spaceRatePlans: mockProductRatePlans,
      });

      expect(screen.getByTestId('choose-space-later-button')).toBeDefined();
      expect(screen.getByTestId('choose-space-later-button')).not.toContain('disabled');
    });

    it('should restrict users from choosing "space plan later" if they select Compose+Launch AND have no paid space in the org', () => {
      build({ selectedPlatform: mockSelectedPlatform });

      expect(screen.queryByTestId('choose-space-later-button')).toBeNull();
    });

    it('should unselect any space plan when clicking on "choose space later"', () => {
      build(null, {
        selectedPlatform: mockSelectedPlatform,
        subscriptionPlans: mockProductRatePlans,
        spaceRatePlans: mockProductRatePlans,
      });
      const spacePlanCards = screen.getAllByTestId('space-plan-card');

      expect(screen.getByTestId('choose-space-later-button')).not.toContain('disabled');
      userEvent.click(screen.getByTestId('choose-space-later-button'));

      for (const spacePlanCard of spacePlanCards) {
        expect(spacePlanCard.getAttribute('class')).not.toContain('--is-selected');
      }
    });
  });
});

async function build(customProps, customState) {
  const props = {
    track: mockTrack,
    ...customProps,
  };

  await renderWithProvider(
    PlatformSelectionStep,
    {
      organization: mockOrganization,
      sessionId: 'random_id',
      composeAndLaunchProductRatePlan: mockComposeAndLaunchProductRatePlan,
      ...customState,
    },
    props
  );
}
