import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';
import { addProductRatePlanToSubscription } from 'features/pricing-entities';
import { SpaceCreationReceiptStep } from './SpaceCreationReceiptStep';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { makeNewSpace, applyTemplateToSpace } from '../../utils/spaceCreation';
import { trackEvent, EVENTS } from '../../utils/analyticsTracking';
import * as $rootScope from 'ng/$rootScope';
import { renderWithProvider } from '../../__tests__/helpers';
import { PlatformKind, PLATFORM_CONTENT } from '../../utils/platformContent';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import * as TokenStore from 'services/TokenStore';

const mockSelectedPlatform = { type: PlatformKind.WEB_APP_COMPOSE_LAUNCH };
const spaceName = 'My Space';
const mockSelectedPlan = { name: 'Medium', price: 123, sys: { id: 'space_plan_id' } };
const mockOrganization = FakeFactory.Organization();
const mockCreatedSpace = FakeFactory.Space();
const mockcomposeAndLaunchProductRatePlan = FakeFactory.Plan();

const mockSessionMetadata = {
  organizationId: mockOrganization.sys.id,
  sessionId: 'some_random_id',
};

jest.mock('../../utils/spaceCreation', () => ({
  makeNewSpace: jest.fn(),
  applyTemplateToSpace: jest.fn(),
}));

jest.mock('features/pricing-entities', () => ({
  addProductRatePlanToSubscription: jest.fn(),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  clearCachedProductCatalogFlags: jest.fn(),
}));

jest.mock('../../utils/analyticsTracking', () => ({
  trackEvent: jest.fn(),
  EVENTS: jest.requireActual('../../utils/analyticsTracking').EVENTS,
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
  refresh: jest.fn(),
}));

describe('SpaceCreationReceiptStep', () => {
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

    expect(screen.getByTestId('receipt.subtext').textContent).toContain('New space');
    expect(screen.getByTestId('receipt.subtext').textContent).toContain(mockSelectedPlan.name);

    // Need to wait for promise to resolve to catch act()
    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-space');
    await waitFor(() => {
      expect(redirectToNewSpace.hasAttribute('disabled')).toBeFalsy();
    });
  });

  it('should show the plan name defined by the user in the paragraph when the space has been successfully created', async () => {
    build(null, { spaceName });

    await waitFor(expect(makeNewSpace).toBeCalled);

    expect(screen.getByTestId('receipt.subtext').textContent).toContain(spaceName);
    expect(screen.getByTestId('receipt.subtext').textContent).toContain(mockSelectedPlan.name);

    // Need to wait for promise to resolve to catch act()
    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-space');
    await waitFor(() => {
      expect(redirectToNewSpace.hasAttribute('disabled')).toBeFalsy();
    });
  });

  it('should show the default plan name and the compose+launch message when the space has been successfully created', async () => {
    build(null, { selectedPlatform: mockSelectedPlatform });

    await waitFor(expect(makeNewSpace).toBeCalled);

    expect(screen.getByTestId('receipt.subtext').textContent).toContain(mockSelectedPlan.name);
    expect(screen.getByTestId('receipt.subtext').textContent).toContain(
      PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title
    );

    // Need to wait for promise to resolve to catch act()
    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-space');
    await waitFor(() => {
      expect(redirectToNewSpace.hasAttribute('disabled')).toBeFalsy();
      expect(clearCachedProductCatalogFlags).toBeCalled();
      expect(TokenStore.refresh).toBeCalled();
    });
  });

  it('should call makeNewSpace and fire an analytic event when there is no selectedTemplate', async () => {
    build(null, { spaceName });

    await waitFor(() => {
      expect(makeNewSpace).toBeCalledWith(
        mockOrganization.sys.id,
        mockSelectedPlan.sys.id,
        spaceName
      );
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.SPACE_CREATED, mockSessionMetadata, {
      selectedPlan: mockSelectedPlan,
    });
  });

  it('should add the addon to the subscription if the selectedPlatform is SPACE_COMPOSE_LAUNCH', async () => {
    build(null, { selectedPlatform: mockSelectedPlatform });

    await waitFor(() => {
      expect(addProductRatePlanToSubscription).toBeCalledWith(
        expect.any(Function),
        mockcomposeAndLaunchProductRatePlan.sys.id
      );
    });
  });

  it('should create the space and purchase addon serially and show the loading state the whole time', async () => {
    let resolveSpaceCreation;

    makeNewSpace.mockImplementationOnce(
      () => new Promise((resolve) => (resolveSpaceCreation = resolve.bind(null, mockCreatedSpace)))
    );

    build(null, { selectedPlatform: mockSelectedPlatform });

    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();

    await waitFor(() => expect(makeNewSpace).toBeCalled());
    expect(addProductRatePlanToSubscription).not.toBeCalled();

    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();

    resolveSpaceCreation();

    await waitFor(() => {
      expect(addProductRatePlanToSubscription).toBeCalled();
    });

    expect(screen.queryByTestId('receipt.loading-envelope')).toBeNull();
  });

  it('should call applyTemplateToSpace when there is a selectedTemplate', async () => {
    const mockTemplate = { test: true };

    build(null, { selectedTemplate: mockTemplate });

    await waitFor(() => {
      expect(applyTemplateToSpace).toBeCalledWith(mockCreatedSpace, mockTemplate);
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

  it('should display an error if the addon purchase erred', async () => {
    const err = new Error('Something went wrong');
    addProductRatePlanToSubscription.mockRejectedValueOnce(err);

    build(null, { selectedPlatform: mockSelectedPlatform });

    await waitFor(() => {
      expect(screen.getByTestId('receipt.error-face')).toBeVisible();
    });
  });

  it('should display an error and fire an analytic event if creating the template of the space errored', async () => {
    const err = new Error('Something went wrong');
    applyTemplateToSpace.mockRejectedValueOnce(err);

    build(null, { selectedTemplate: 'Test' });

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

    userEvent.click(screen.getByTestId('receipt-page.redirect-to-space'));

    await waitFor(() => {
      expect(makeNewSpace).toHaveBeenCalledTimes(2);
    });
  });

  it('should show a warning note if template content creation fails', async () => {
    applyTemplateToSpace.mockRejectedValueOnce(new Error('Something went wrong'));

    build(null, { selectedTemplate: {} });

    await waitFor(() => {
      expect(applyTemplateToSpace).toBeCalled();
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

    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-space');
    expect(redirectToNewSpace).toHaveAttribute('disabled');
    expect(within(redirectToNewSpace).getByTestId('cf-ui-spinner')).toBeVisible();
    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();
  });

  it('should set and unset the beforeunload and $stateChangeStart event listeners when creating the space', async () => {
    let resolveCreateSpace;
    makeNewSpace.mockImplementationOnce(() => {
      return new Promise((resolve) => (resolveCreateSpace = () => resolve(mockCreatedSpace)));
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

    const redirectToNewSpace = screen.getByTestId('receipt-page.redirect-to-space');

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
    ...customProps,
  };

  renderWithProvider(
    SpaceCreationReceiptStep,
    {
      organization: mockOrganization,
      selectedPlan: mockSelectedPlan,
      composeAndLaunchProductRatePlan: mockcomposeAndLaunchProductRatePlan,
      sessionId: mockSessionMetadata.sessionId,
      ...customState,
    },
    props
  );
}
