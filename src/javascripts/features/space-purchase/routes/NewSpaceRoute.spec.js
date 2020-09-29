import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { NewSpaceRoute } from './NewSpaceRoute';
import { getVariation } from 'LaunchDarkly';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { getBasePlan, getRatePlans } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import { fetchSpacePurchaseContent } from '../services/fetchSpacePurchaseContent';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { getOrganizationMembership } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import * as TokenStore from 'services/TokenStore';
import * as FakeFactory from 'test/helpers/fakeFactory';

const mockOrganization = FakeFactory.Organization();
const mockUserRole = 'admin';
const mockOrganizationPlatform = 'Free';

jest.mock('../utils/analyticsTracking', () => ({
  trackEvent: jest.fn(),
  EVENTS: jest.requireActual('../utils/analyticsTracking').EVENTS,
}));

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  getOrganizationMembership: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getRatePlans: jest.fn(),
  getBasePlan: jest.fn(),
}));

jest.mock('../services/fetchSpacePurchaseContent', () => ({
  fetchSpacePurchaseContent: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const resourceService = {
    get: jest.fn(),
  };

  return () => resourceService;
});

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

// Mock NewSpacePage in order to not have to mock the imports/on render effects it has
jest.mock('../components/NewSpacePage', () => ({
  NewSpacePage: jest.fn().mockReturnValue(<div data-test-id="new-space-page" />),
}));

describe('NewSpaceRoute', () => {
  beforeEach(() => {
    createResourceService().get.mockResolvedValue({ usage: 0, limits: { maximum: 1 } });
    getVariation.mockClear().mockResolvedValue(true);
    TokenStore.getOrganization.mockResolvedValue(mockOrganization);
    getTemplatesList.mockResolvedValue();
    getRatePlans.mockResolvedValue();
    fetchSpacePurchaseContent.mockResolvedValue();
    getOrganizationMembership.mockReturnValue({ role: mockUserRole });
    getBasePlan.mockReturnValue({ customerType: mockOrganizationPlatform });
  });

  it('should render a spinner while loading', () => {
    build();

    expect(screen.getByTestId('space-route-loading')).toBeVisible();
  });

  it('should redirect to space home if the new flow is not enabled', async () => {
    getVariation.mockResolvedValueOnce(false);
    build();

    await waitFor(() => {
      expect(go).toBeCalledWith({ path: 'home' });
    });
  });

  it('should render the NewSpacePage and fire an event after loading', async () => {
    build();

    await waitFor(() => {
      expect(screen.getByTestId('new-space-page')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
      }
    );
  });
});

function build(customProps) {
  const props = {
    orgId: mockOrganization.sys.id,
    ...customProps,
  };

  render(<NewSpaceRoute {...props} />);
}
