import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';
import { NewSpaceReceiptPage } from './NewSpaceReceiptPage';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { createSpace, createSpaceWithTemplate } from '../utils/spaceCreation';

const spaceName = 'My Space';
const monthlyTotal = 2000;
const mockSelectedPlan = { name: 'Medium', price: 123 };
const mockOrganization = FakeFactory.Organization();
const mockCreatedSpace = FakeFactory.Space();

jest.mock('../utils/spaceCreation', () => ({
  createSpace: jest.fn(),
  createSpaceWithTemplate: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

describe('NewSpaceReceiptPage', () => {
  beforeEach(() => {
    createSpace.mockResolvedValue(mockCreatedSpace);
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

  it('should call createSpace when there is no selectedTemplate', async () => {
    build();

    await waitFor(() => {
      expect(createSpace).toBeCalledWith(mockOrganization.sys.id, mockSelectedPlan, spaceName);
    });
  });

  it('should call createSpaceWithTemplate when there is a selectedTemplate', async () => {
    const mockTemplate = { test: true };
    build({ selectedTemplate: mockTemplate });

    await waitFor(() => {
      expect(createSpaceWithTemplate).toBeCalledWith(
        mockOrganization.sys.id,
        mockSelectedPlan,
        spaceName,
        mockTemplate
      );
    });
  });

  it('should display an error if the creation of the space errored', async () => {
    createSpace.mockRejectedValueOnce();
    build();

    await waitFor(() => {
      expect(screen.queryByText('Space could not be created, please try again.')).toBeVisible();
    });
  });

  it('should display a loading state while creating the space', async () => {
    let createSpacePromise;
    createSpace.mockImplementation(() => {
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

  it('should show the correct monthly total of all subscriptions', async () => {
    const parsedPrice = parseInt(monthlyTotal + mockSelectedPlan.price, 10).toLocaleString('en-US');

    build({ monthlyTotal });

    const monthlyTotalMsg = screen.getByTestId('order-summary.selected-plan-price');
    expect(monthlyTotalMsg.textContent).toEqual(`Monthly total $${parsedPrice}`);
  });
});

function build(customProps) {
  const props = {
    spaceName,
    selectedPlan: mockSelectedPlan,
    organizationId: mockOrganization.sys.id,
    ...customProps,
  };

  render(<NewSpaceReceiptPage {...props} />);
}
