import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as FakeFactory from 'test/helpers/fakeFactory';
import { EVENTS } from '../../utils/analyticsTracking';
import { renderWithProvider } from '../../__tests__/helpers';
import { PlatformSelectionStep, PACKAGES_COMPARISON_HREF } from './PlatformSelectionStep';

const mockTrack = jest.fn();
const mockOrganization = FakeFactory.Organization();

describe('PlatformSelectionStep', () => {
  it('should render a link to the package comparison page in the website', async () => {
    await build();

    const comparisonLink = screen.getByTestId('package-comparison-link');

    expect(comparisonLink).toBeVisible();
    expect(comparisonLink.textContent).toBe('See comparison packages');
    expect(comparisonLink.getAttribute('href')).toBe(PACKAGES_COMPARISON_HREF);

    userEvent.click(comparisonLink);
    expect(mockTrack).toHaveBeenCalledWith(EVENTS.EXTERNAL_LINK_CLICKED, {
      href: PACKAGES_COMPARISON_HREF,
      intent: 'packages_comparison',
    });
  });

  describe('Platform cards', () => {
    let platformCards;

    beforeEach(async () => {
      await build();
      platformCards = screen.getAllByTestId('platform-card');
    });

    it('should render two cards for platform cards', () => {
      expect(platformCards).toHaveLength(2);
      expect(within(platformCards[1]).getByTestId('product-price')).toBeDefined();
    });

    it('should select the card when user clicks on it', () => {
      // This is necessary because jest-dom does not have scrollIntoView
      const scrollIntoViewMock = jest.fn();
      // eslint-disable-next-line no-undef
      HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      for (const platformCard of platformCards) {
        userEvent.click(platformCard);
        expect(platformCard.getAttribute('class')).toContain('--is-selected');
        expect(scrollIntoViewMock).toBeCalledWith({ behavior: 'smooth', block: 'start' });
      }
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
      await build();
      spacePlanCards = screen.getAllByTestId('space-plan-card');
    });

    it('should render three cards for the space plans', () => {
      expect(spacePlanCards).toHaveLength(3);

      for (const spacePlanCard of spacePlanCards) {
        expect(within(spacePlanCard).getByTestId('product-price')).toBeDefined();
      }
    });

    it('should select the card when user clicks on it', () => {
      for (const spacePlanCard of spacePlanCards) {
        userEvent.click(spacePlanCard);
        expect(spacePlanCard.getAttribute('class')).toContain('--is-selected');
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
      spaceRatePlans: [
        { name: 'Community', price: 0 },
        { name: 'Medium', price: 489 },
        { name: 'Large', price: 889 },
      ],
      sessionId: 'random_id',
      ...customState,
    },
    props
  );
}
