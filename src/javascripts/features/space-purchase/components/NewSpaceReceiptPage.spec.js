import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';
import { NewSpaceReceiptPage } from './NewSpaceReceiptPage';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { makeNewSpace, createTemplate } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';

const spaceName = 'My Space';
const mockSelectedPlan = { name: 'Medium', price: 123 };
const mockOrganization = FakeFactory.Organization();
const mockCreatedSpace = FakeFactory.Space();
const mockSessionMetadata = {
  organizationId: mockOrganization.sys.id,
  sessionId: 'some_random_id',
};

jest.mock('../utils/spaceCreation', () => ({
  makeNewSpace: jest.fn(),
  createTemplate: jest.fn(),
}));

jest.mock('../utils/analyticsTracking', () => ({
  trackEvent: jest.fn(),
  EVENTS: jest.requireActual('../utils/analyticsTracking').EVENTS,
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

describe('NewSpaceReceiptPage', () => {
  beforeEach(() => {
    makeNewSpace.mockResolvedValue(mockCreatedSpace);
  });

  it('should show the plan name and plan type', async () => {
    build();

    expect(screen.getByTestId('new-space-receipt-success').textContent).toContain(spaceName);
    expect(screen.getByTestId('new-space-receipt-success').textContent).toContain(
      mockSelectedPlan.name
    );

    // Need to wait for promise to resolve to catch act()
    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-new-space');
    await waitFor(() => {
      expect(redirectToNewSpace.hasAttribute('disabled')).toBeFalsy();
    });
  });

  it('should call makeNewSpace and fire an analytic event when there is no selectedTemplate', async () => {
    build();

    await waitFor(() => {
      expect(makeNewSpace).toBeCalledWith(mockOrganization.sys.id, mockSelectedPlan, spaceName);
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.SPACE_CREATED, mockSessionMetadata, {
      selectedPlan: mockSelectedPlan,
    });
  });

  it('should call createTemplate when there is a selectedTemplate', async () => {
    const mockTemplate = { test: true };
    build({ selectedTemplate: mockTemplate });

    await waitFor(() => {
      expect(createTemplate).toBeCalledWith(mockCreatedSpace, mockTemplate);
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.SPACE_CREATED, mockSessionMetadata, {
      selectedPlan: mockSelectedPlan,
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.SPACE_TEMPLATE_CREATED, mockSessionMetadata, {
      selectedTemplate: mockTemplate,
    });
  });

  it('should display an error and fire an analytic event if the creation of the space errored', async () => {
    makeNewSpace.mockRejectedValueOnce();
    build();

    await waitFor(() => {
      expect(screen.queryByText('Space could not be created, please try again.')).toBeVisible();
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.ERROR, mockSessionMetadata, {
      location: 'NewSpaceReceiptPage',
    });
  });

  it('should display a loading state while creating the space', async () => {
    let createSpacePromise;
    makeNewSpace.mockImplementation(() => {
      createSpacePromise = new Promise(() => {});
      return createSpacePromise;
    });
    build();

    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-new-space');
    expect(redirectToNewSpace).toHaveAttribute('disabled');
    expect(within(redirectToNewSpace).getByTestId('cf-ui-spinner')).toBeVisible();
  });

  it('should redirect to the new space when clicking on the button after the space has been', async () => {
    build();

    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-new-space');

    await waitFor(() => {
      expect(redirectToNewSpace.hasAttribute('disabled')).toBeFalsy();
    });

    userEvent.click(redirectToNewSpace);

    await waitFor(() => {
      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockCreatedSpace.sys.id },
      });
    });
  });
});

function build(customProps) {
  const props = {
    spaceName,
    selectedPlan: mockSelectedPlan,
    organizationId: mockOrganization.sys.id,
    sessionMetadata: mockSessionMetadata,
    ...customProps,
  };

  render(<NewSpaceReceiptPage {...props} />);
}
