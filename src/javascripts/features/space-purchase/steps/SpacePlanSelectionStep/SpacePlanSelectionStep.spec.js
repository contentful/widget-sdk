import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as trackCTA from 'analytics/trackCTA';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { EVENTS } from '../../utils/analyticsTracking';
import { SpacePlanSelectionStep, FEATURE_OVERVIEW_HREF } from './SpacePlanSelectionStep';
import { SPACE_PURCHASE_TYPES } from '../../utils/spacePurchaseContent';
import { SpacePurchaseState } from '../../context';

const mockOrganization = FakeFactory.Organization();
const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');
const mockSelectPlan = jest.fn();

describe('SpacePlanSelectionStep', () => {
  it('should show a heading', () => {
    build();

    expect(screen.getByTestId('space-selection.heading')).toBeVisible();
  });

  it('should show all three space cards', () => {
    build();

    expect(screen.getAllByTestId('space-card')).toHaveLength(3);
  });

  it('should disable the paid space cards if canCreatePaidSpace is false', () => {
    build({ canCreatePaidSpace: false });

    const spaceCards = screen.getAllByTestId('space-card');

    for (const spaceCard of spaceCards) {
      expect(within(spaceCard).getByTestId('select-space-cta')).toHaveAttribute('disabled');
    }
  });

  it('should show the payment details note if canCreatePaidSpace is false', () => {
    build({ canCreatePaidSpace: false });

    expect(screen.getByTestId('payment-details-required')).toBeVisible();
  });

  it('should show the community card', () => {
    build();

    expect(screen.getByTestId('space-selection.community-card')).toBeVisible();
  });

  it('should show the feature overview link and log when it is clicked', () => {
    const trackWithSession = jest.fn();
    build({ trackWithSession });

    const featureOverviewLink = screen.getByTestId('space-selection.feature-overview-link');
    expect(featureOverviewLink).toBeVisible();

    userEvent.click(featureOverviewLink);

    expect(trackWithSession).toHaveBeenCalledWith(EVENTS.EXTERNAL_LINK_CLICKED, {
      href: FEATURE_OVERVIEW_HREF,
      intent: 'feature_overview',
    });
  });

  it('should track the click and open the sales form in a new tab when the enterprise select button is clicked', () => {
    const trackWithSession = jest.fn();
    build({ trackWithSession });

    userEvent.click(screen.getAllByTestId('select-space-cta')[2]);

    expect(trackWithSession).toHaveBeenCalledWith(EVENTS.EXTERNAL_LINK_CLICKED, {
      href:
        'https://www.contentful.com/contact/sales/?utm_medium=webapp&utm_source=purchase-space-page&utm_campaign=cta-enterprise-space&utm_content=contact-us',
      intent: 'upgrade_to_enterprise',
    });

    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      organizationId: mockOrganization.sys.id,
    });
  });

  it('should call selectPlan when the medium or large space is selected', () => {
    build();

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    expect(mockSelectPlan).toBeCalledWith(SPACE_PURCHASE_TYPES.MEDIUM);
  });

  it('should enable the community plan button if the user can create a free space', () => {
    build();

    const communitySelectButton = screen.getByTestId('space-selection-community-select-button');

    expect(communitySelectButton).toHaveProperty('disabled', false);
  });

  it('should disable the community plan button if the user cannot create a free space', () => {
    build({ canCreateCommunityPlan: false });

    const communitySelectButton = screen.getByTestId('space-selection-community-select-button');

    expect(communitySelectButton).toHaveProperty('disabled', true);
  });
});

function build(customProps, customState) {
  const props = {
    loading: false,
    organizationId: mockOrganization.sys.id,
    selectPlan: mockSelectPlan,
    canCreateCommunityPlan: true,
    trackWithSession: () => {},
    canCreatePaidSpace: true,
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
      <SpacePlanSelectionStep {...props} />
    </SpacePurchaseState.Provider>
  );
}
