import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as trackCTA from 'analytics/trackCTA';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { SpaceSelection } from './SpaceSelection';
import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';

const mockOrganization = FakeFactory.Organization();
const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');
const mockSelectPlan = jest.fn();

describe('SpaceSelection', () => {
  it('should show a heading', () => {
    build();

    expect(screen.getByTestId('space-selection.heading')).toBeVisible();
  });

  it('should show all three space cards', () => {
    build();

    expect(screen.getAllByTestId('space-card')).toHaveLength(3);
  });

  it('should show the community card', () => {
    build();

    expect(screen.getByTestId('space-selection.community-card')).toBeVisible();
  });

  it('should track the click and open the sales form in a new tab when the enterprise select button is clicked', () => {
    build();

    userEvent.click(screen.getAllByTestId('space-cta')[2]);

    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      organizationId: mockOrganization.sys.id,
    });
  });

  it('should call selectPlan when the medium or large space is selected', () => {
    build();

    userEvent.click(screen.getAllByTestId('space-cta')[0]);

    expect(mockSelectPlan).toBeCalledWith(SPACE_PURCHASE_TYPES.MEDIUM);
  });
});

function build(customProps) {
  const props = {
    organizationId: mockOrganization.sys.id,
    selectPlan: mockSelectPlan,
    ...customProps,
  };

  render(<SpaceSelection {...props} />);
}
