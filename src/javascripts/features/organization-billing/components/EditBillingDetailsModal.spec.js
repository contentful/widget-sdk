import React from 'react';
import { when } from 'jest-when';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import cleanupNotifications from 'test/helpers/cleanupNotifications';

// eslint-disable-next-line
import { mockOrganizationEndpoint } from 'data/EndpointFactory';

import { EditBillingDetailsModal } from './EditBillingDetailsModal';

jest.useFakeTimers();

when(mockOrganizationEndpoint)
  .calledWith(expect.objectContaining({ path: ['billing_details'], method: 'PUT' }))
  .mockResolvedValue();

const mockOrganization = Fake.Organization();
const mockBillingDetails = {
  firstName: 'David',
  lastName: 'Attenborough',
  workEmail: 'david@davidattenborough.com',
  address1: 'Some Lane',
  city: 'Brighton',
  country: 'United Kingdom',
  zipCode: '1AB30',
};

describe('EditBillingDetailsModal', () => {
  afterEach(cleanupNotifications);

  it('should render BillingDetailsForm', () => {
    build();

    expect(screen.getByTestId('billing-details-form')).toBeVisible();
  });

  it('should call onCancel if the cancel button is clicked', async () => {
    const onCancel = jest.fn();

    build({ onCancel });

    userEvent.click(screen.getByTestId('billing-details.cancel'));

    await waitFor(expect(onCancel).toBeCalled);
  });

  it('should not attempt to update the billing details if the form has errors', async () => {
    const onConfirm = jest.fn();

    build({ onConfirm });

    userEvent.clear(
      within(screen.getByTestId('billing-details.address1')).getByTestId('cf-ui-text-input')
    );
    userEvent.click(screen.getByTestId('billing-details.submit'));

    await waitFor(expect(mockOrganizationEndpoint).not.toBeCalled);
  });

  it('should send a request to the billing_details API and call onConfirm when the form is valid and submitted', async () => {
    const onConfirm = jest.fn();

    build({ onConfirm });

    userEvent.click(screen.getByTestId('billing-details.submit'));

    await waitFor(() =>
      expect(mockOrganizationEndpoint).toBeCalledWith({
        method: 'PUT',
        path: ['billing_details'],
        data: expect.objectContaining(mockBillingDetails),
      })
    );

    expect(onConfirm).toBeCalledWith(expect.objectContaining(mockBillingDetails));
  });

  it('should show a success notification when the API request is successful', async () => {
    build();

    userEvent.click(screen.getByTestId('billing-details.submit'));

    await waitFor(() => screen.getByTestId('cf-ui-notification'));

    expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'success');
  });

  it('should show an error notification when the API request fails', async () => {
    when(mockOrganizationEndpoint)
      .calledWith(expect.objectContaining({ path: ['billing_details'], method: 'PUT' }))
      .mockRejectedValueOnce();

    build();

    userEvent.click(screen.getByTestId('billing-details.submit'));

    await waitFor(() => screen.getByTestId('cf-ui-notification'));

    expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
  });
});

function build(custom) {
  const props = Object.assign(
    {
      organizationId: mockOrganization.sys.id,
      billingDetails: mockBillingDetails,
      isShown: true,
      onCancel: () => {},
      onConfirm: () => {},
    },
    custom
  );

  render(<EditBillingDetailsModal {...props} />);
}
