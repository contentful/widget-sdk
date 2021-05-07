import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import { beginSpaceCreation } from 'services/CreateSpace';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { track } from 'analytics/Analytics';
import { go } from 'states/Navigator';

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

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

describe('SpaceSectionHeader', () => {
  // TODO: remove this whole test suite once isSpaceSectionRebrandingEnabled is removed from code
  describe('isSpaceSectionRebrandingEnabled is OFF', () => {
    it('renders the old space section header', () => {
      build();

      expect(screen.getByTestId('space-section-header-previous-version')).toBeVisible();
      expect(screen.queryByTestId('space-section-header')).toBeNull();
    });

    it('should say if an organization has 0 spaces', () => {
      build({ numberOfSpaces: 0 });

      const orgInformation = screen.getByTestId('subscription-page.organization-information');
      expect(orgInformation).toHaveTextContent('Your organization doesn’t have any spaces.');
    });

    it('should display the total cost of the spaces in non-enterprise organizations.', () => {
      build({ selServiceTotalCost: 123 });

      const priceInformation = screen.getByTestId(
        'subscription-page.non-enterprise-price-information'
      );
      expect(priceInformation).toHaveTextContent('The total for your spaces is $123 per month');
    });

    it('should not display the total cost of the spaces in an enterprise organization.', () => {
      build({ enterprisePlan: true });

      const priceInformation = screen.queryByTestId(
        'subscription-page.non-enterprise-price-information'
      );
      expect(priceInformation).toBeNull();
    });

    it('should call onCreateSpace when the create-space button is clicked', () => {
      build();

      const createSpaceLink = screen.getByTestId('subscription-page.create-space');
      fireEvent.click(createSpaceLink);
      expect(beginSpaceCreation).toHaveBeenCalledWith(mockOrganization.sys.id);
    });

    it('should render a help icon and tooltip when at least one spacePlan does not have space or space.isAccessible is false', async () => {
      build({
        hasAnySpacesInaccessible: true,
      });

      const infoIcon = screen.getByTestId('inaccessible-help-icon');

      expect(infoIcon).toBeVisible();
      fireEvent.mouseOver(infoIcon);

      await waitFor(() => expect(screen.getByTestId('inaccessible-help-tooltip')).toBeVisible());
    });

    it('should display the export btn', () => {
      build({ numberOfSpaces: 7 });

      const exportButton = screen.getByTestId('subscription-page.export-csv');
      expect(exportButton).toBeVisible();
    });

    it('should not display the export btn if there are no assigned spaces', () => {
      build({ numberOfSpaces: 0 });

      const exportButton = screen.queryByTestId('subscription-page.export-csv');
      expect(exportButton).toBeNull();
    });
  });

  describe('isSpaceSectionRebrandingEnabled is ON', () => {
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
      expect(go).toHaveBeenCalledWith({
        path: '^.space_create',
      });
      expect(track).toHaveBeenCalledWith('space_creation:begin', { flow: 'space_creation' });
    });
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

  render(<SpaceSectionHeader {...props} />);
}
