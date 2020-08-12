import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as trackCTA from 'analytics/trackCTA';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { SpaceSelection } from './SpaceSelection';

const mockOrganization = FakeFactory.Organization();
const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');

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
});

function build(customProps) {
  const props = {
    organizationId: mockOrganization.sys.id,
    ...customProps,
  };

  render(<SpaceSelection {...props} />);
}
