import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as FakeFactory from 'test/helpers/fakeFactory';
import { EVENTS } from '../../utils/analyticsTracking';
import { SpacePurchaseState } from '../../context';
import { PlatformSelectionStep, PACKAGES_COMPARISON_HREF } from './PlatformSelectionStep';

const mockTrack = jest.fn();
const mockOrganization = FakeFactory.Organization();

describe('PlatformSelectionStep', () => {
  it('should render a link to the package comparison page in the website', () => {
    build();

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

    beforeEach(() => {
      build();
      platformCards = screen.getAllByTestId('platform-card');
    });

    it('should render two cards for platform cards', () => {
      expect(platformCards).toHaveLength(2);
    });

    it('should select the card when user clicks on it', () => {
      userEvent.click(platformCards[0]);
      expect(platformCards[0].getAttribute('class')).toContain('--is-selected');

      userEvent.click(platformCards[1]);
      expect(platformCards[1].getAttribute('class')).toContain('--is-selected');
    });

    it('should render one platform card with price', () => {
      const platformPrices = screen.getAllByTestId('platform-price');
      expect(platformPrices).toHaveLength(1);
    });
  });

  describe('Enterprise card', () => {
    let enterpriseCard;

    beforeEach(() => {
      build();
      enterpriseCard = screen.getByTestId('enterprise-card');
    });

    it('should render one Enterprise card', () => {
      expect(enterpriseCard).toBeVisible();
    });

    it('should have a "Talk to us" button', () => {
      const talkToUs = screen.getByTestId('talk-to-us');
      expect(talkToUs).toBeVisible();
    });
  });
});

function build(customProps, customState) {
  const props = {
    track: mockTrack,
    ...customProps,
  };

  const contextValue = {
    state: {
      organization: mockOrganization,
      currentSpace: {},
      currentSpaceRatePlan: {},
      sessionId: 'random_id',
      ...customState,
    },
    dispatch: jest.fn(),
  };

  render(
    <SpacePurchaseState.Provider value={contextValue}>
      <PlatformSelectionStep {...props} />
    </SpacePurchaseState.Provider>
  );
}
