import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import { beginSpaceCreation } from 'services/CreateSpace';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { track } from 'analytics/Analytics';
import { MemoryRouter } from 'core/react-routing';

import { SpaceSectionHeader } from './SpaceSectionHeader';

const mockOrganization = Fake.Organization();

jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
}));

jest.mock('analytics/trackCTA', () => ({
  trackCTAClick: jest.fn(),
  CTA_EVENTS: {
    CREATE_SPACE: 'create_space',
  },
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

describe('SpaceSectionHeader', () => {
  const customProps = { isSpaceSectionRebrandingEnabled: true };

  it('renders the rebranded space section header', () => {
    build(customProps);

    expect(screen.queryByTestId('space-section-header-previous-version')).toBeNull();
    expect(screen.getByTestId('space-section-header')).toBeVisible();
  });

  it('renders how many space plans the organization has', () => {
    build({ ...customProps, numberOfSpaces: 7 });

    const heading = screen.getByTestId('space-section-heading');
    expect(heading).toHaveTextContent('Spaces (7)');
  });

  it('renders "inaccessible tooltip" if user has any inaccessible space', async () => {
    build({ ...customProps, hasAnySpacesInaccessible: true });

    const infoIcon = screen.getByTestId('inaccessible-help-icon');

    expect(infoIcon).toBeVisible();
    fireEvent.mouseOver(infoIcon);

    await waitFor(() => expect(screen.getByTestId('inaccessible-help-tooltip')).toBeVisible());
  });

  it('renders the export button if numberOfSpaces > 0', () => {
    build({ ...customProps, numberOfSpaces: 7 });

    const exportButton = screen.getByTestId('subscription-page.export-csv');
    expect(exportButton).toBeVisible();
  });

  it('renders the Add Space button and it calls beginSpaceCreation if org is NOT Enterprise', () => {
    build(customProps);

    const addSpaceButton = screen.getByTestId('subscription-page.create-space');

    expect(addSpaceButton).toBeVisible();
    fireEvent.click(addSpaceButton);
    expect(beginSpaceCreation).toHaveBeenCalledWith(mockOrganization.sys.id);
    expect(trackCTAClick).toHaveBeenCalledWith(CTA_EVENTS.CREATE_SPACE, {
      organizationId: mockOrganization.sys.id,
    });
  });

  it('renders the Add Space button and it sends user to space_create route if org is Enterprise', () => {
    build({ ...customProps, enterprisePlan: true, isCreateSpaceForSpacePlanEnabled: true });

    const addSpaceButton = screen.getByTestId('subscription-page.create-space');

    expect(addSpaceButton).toBeVisible();
    fireEvent.click(addSpaceButton);
    expect(track).toHaveBeenCalledWith('space_creation:begin', { flow: 'space_creation' });
  });
});

function build(customProps) {
  const props = {
    isLoading: false,
    enterprisePlan: false,
    selServiceTotalCost: 0,
    hasAnySpacesInaccessible: false,
    isCreateSpaceForSpacePlanEnabled: false,
    isSpaceSectionRebrandingEnabled: false,
    numberOfSpaces: 6,
    organizationId: mockOrganization.sys.id,
    ...customProps,
  };

  render(
    <MemoryRouter>
      <SpaceSectionHeader {...props} />
    </MemoryRouter>
  );
}
