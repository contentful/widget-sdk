import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';
import { NewSpaceReceiptPage } from './NewSpaceReceiptPage';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { makeNewSpace, createTemplate } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import * as $rootScope from 'ng/$rootScope';
import { SpacePurchaseState } from '../context';

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
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    window.addEventListener.mockRestore();
    window.removeEventListener.mockRestore();
  });

  it('should show the plan name and plan type in the paragraph when the space has been successfully created', async () => {
    build();

    await waitFor(expect(makeNewSpace).toBeCalled);

    expect(screen.getByTestId('receipt.subtext').textContent).toContain(spaceName);
    expect(screen.getByTestId('receipt.subtext').textContent).toContain(mockSelectedPlan.name);

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
    const err = new Error('Something went wrong');
    makeNewSpace.mockRejectedValueOnce(err);
    build();

    await waitFor(() => {
      expect(screen.getByTestId('receipt.error-face')).toBeVisible();
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.ERROR, mockSessionMetadata, {
      errorType: 'CreateSpaceError',
      error: err,
    });
  });

  it('should display an error and fire an analytic event if creating the template of the space errored', async () => {
    const err = new Error('Something went wrong');
    makeNewSpace.mockResolvedValueOnce({ newSpace: 'test' });
    createTemplate.mockRejectedValueOnce(err);
    build({ selectedTemplate: {} });

    await waitFor(() => {
      expect(screen.queryByTestId('receipt-page.template-creation-error')).toBeVisible();
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.ERROR, mockSessionMetadata, {
      errorType: 'CreateTemplateError',
      error: err,
    });
  });

  it('should restart the space creation if it errs and the user clicks the button again', async () => {
    makeNewSpace.mockRejectedValueOnce(new Error('Something went wrong'));
    build();

    await waitFor(() => {
      expect(screen.getByTestId('receipt.error-face')).toBeVisible();
    });

    expect(makeNewSpace).toHaveBeenCalledTimes(1);

    userEvent.click(screen.getByTestId('receipt-page.redirect-to-new-space'));

    await waitFor(() => {
      expect(makeNewSpace).toHaveBeenCalledTimes(2);
    });
  });

  it('should show a warning note if template content creation fails', async () => {
    createTemplate.mockRejectedValueOnce(new Error('Something went wrong'));
    build({ selectedTemplate: {} });

    await waitFor(() => {
      expect(createTemplate).toBeCalled();
    });

    expect(screen.getByTestId('receipt-page.template-creation-error')).toBeVisible();
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
    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();
  });

  it('should set and unset the beforeunload and $stateChangeStart event listeners when creating the space', async () => {
    let resolveCreateSpace;
    makeNewSpace.mockImplementationOnce(() => {
      return new Promise((resolve) => (resolveCreateSpace = () => resolve(true)));
    });

    const mockOffCb = jest.fn();

    $rootScope.$on.mockReturnValue(mockOffCb);

    build();

    expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect($rootScope.$on).toHaveBeenCalledWith('$stateChangeStart', expect.any(Function));

    await waitFor(expect(makeNewSpace).toBeCalled);
    await waitFor(resolveCreateSpace);

    await waitFor(() => {
      expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      expect(mockOffCb).toBeCalled();
    });

    $rootScope.$on.mockReset();
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

function build(customProps, customState) {
  const props = {
    spaceName,
    selectedPlan: mockSelectedPlan,
    organizationId: mockOrganization.sys.id,
    sessionMetadata: mockSessionMetadata,
    ...customProps,
  };

  const contextValue = {
    state: { selectedPlan: mockSelectedPlan, ...customState },
    dispatch: jest.fn(),
  };

  render(
    <SpacePurchaseState.Provider value={contextValue}>
      <NewSpaceReceiptPage {...props} />
    </SpacePurchaseState.Provider>
  );
}
