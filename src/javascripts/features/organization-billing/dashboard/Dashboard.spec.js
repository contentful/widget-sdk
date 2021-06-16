import React from 'react';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { when } from 'jest-when';
import * as Fake from 'test/helpers/fakeFactory';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { MemoryRouter } from 'core/react-routing';

// eslint-disable-next-line
import { mockOrganizationEndpoint } from 'data/EndpointFactory';
import { Dashboard } from './Dashboard';

const mockOrganization = Fake.Organization();
const mockInvoiceData = new ArrayBuffer([1, 2, 3, 4]);

when(mockOrganizationEndpoint)
  .calledWith(expect.objectContaining({ path: ['invoices', expect.any(String)] }))
  .mockResolvedValue(mockInvoiceData);

describe('Dashboard', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(async () => {});
    jest.spyOn(window, 'Blob').mockImplementation(() => {});

    window.URL.createObjectURL = jest.fn(() => 'blob://blahblah');
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    ModalLauncher.open.mockRestore();
    window.Blob.mockRestore();
    delete window.URL.createObjectURL;
    delete window.URL.revokeObjectURL;
  });

  describe('self-service organization', () => {
    const mockBillingDetails = {};
    const mockPaymentDetails = {
      number: '',
      expirationDate: {},
    };

    const build = (custom) =>
      renderDashboard({
        billingDetails: mockBillingDetails,
        paymentDetails: mockPaymentDetails,
        ...custom,
      });

    it('should show all loading states when loading', () => {
      build({ loading: true });

      expect(screen.getByTestId('invoices-loading')).toBeVisible();
      expect(screen.getByTestId('credit-card-details-loading')).toBeVisible();
      expect(screen.getByTestId('billing-details-loading')).toBeVisible();
    });

    it('should open a modal if the billing details "Edit" link is clicked', () => {
      build();

      fireEvent.click(screen.getByTestId('edit-billing-details-link'));

      expect(ModalLauncher.open).toBeCalledWith(expect.any(Function));
    });

    it('should not call onEditBillingDetails if ModalLauncher.open returns something falsy', async () => {
      const onEditBillingDetails = jest.fn();

      build({ onEditBillingDetails });

      fireEvent.click(screen.getByTestId('edit-billing-details-link'));

      await waitFor(expect(ModalLauncher.open).toBeCalled);

      expect(onEditBillingDetails).not.toBeCalled();
    });

    it('should call onEditBillingDetails with the result of ModalLauncher.open if it returns something truthy', async () => {
      ModalLauncher.open.mockResolvedValueOnce('something');

      const onEditBillingDetails = jest.fn();

      build({ onEditBillingDetails });

      fireEvent.click(screen.getByTestId('edit-billing-details-link'));

      await waitFor(expect(ModalLauncher.open).toBeCalled);

      expect(onEditBillingDetails).toBeCalledWith('something');
    });
  });

  describe('enterprise organization', () => {
    const build = (custom) =>
      renderDashboard({ orgIsEnterprise: true, orgIsSelfService: false, ...custom });

    it('should only show the invoices loading state when loading', () => {
      build({ loading: true });

      expect(screen.getByTestId('invoices-loading')).toBeVisible();
      expect(screen.queryByTestId('credit-card-details-loading')).toBeNull();
      expect(screen.queryByTestId('billing-details-loading')).toBeNull();
    });

    it('should show copy telling the user to contact their AE to update their billing details', () => {
      build();

      expect(screen.getByTestId('enterprise-ae')).toBeVisible();
    });
  });

  describe('other organization', () => {
    const build = (custom) =>
      renderDashboard({ orgIsEnterprise: false, orgIsSelfService: false, ...custom });

    it('should only show the invoices loading state when loading', () => {
      build({ loading: true });

      expect(screen.getByTestId('invoices-loading')).toBeVisible();
      expect(screen.queryByTestId('credit-card-details-loading')).toBeNull();
      expect(screen.queryByTestId('billing-details-loading')).toBeNull();
    });

    it('should not show copy telling the user to contact their AE to update their billing details', () => {
      build();

      expect(screen.queryByTestId('enterprise-ae')).toBeNull();
    });
  });

  it('should show an empty invoices table if no invoices are given', () => {
    renderDashboard();

    expect(screen.getByTestId('no-invoices')).toBeVisible();
  });

  it('should show an empty invoices table if an empty array is given', () => {
    renderDashboard({ invoices: [] });

    expect(screen.getByTestId('no-invoices')).toBeVisible();
  });

  it('should show a row for each invoice in the array and should format the amount and date', () => {
    const invoices = [
      { sys: { id: 'invoice_1', invoiceDate: '2020-01-02' }, amount: 100 },
      { sys: { id: 'invoice_2', invoiceDate: '2020-02-02' }, amount: 500 },
      { sys: { id: 'invoice_3', invoiceDate: '2020-03-02' }, amount: 1000 },
    ];

    renderDashboard({ invoices });

    const allInvoiceRows = screen.getAllByTestId('invoice-row');

    expect(allInvoiceRows).toHaveLength(3);
    expect(within(allInvoiceRows[2]).getByTestId('invoice-date').textContent).toBe('Mar 02, 2020');
    expect(within(allInvoiceRows[2]).getByTestId('invoice-amount').textContent).toBe('$1,000');
  });

  it('should attempt to download the invoice using the Blob API if a download link is clicked', async () => {
    // NOTE: jsdom does not handle link clicks in any way, at least right now. See
    // https://github.com/jsdom/jsdom/blob/865ad590454dd345521722184bc298b32fa40810/lib/jsdom/living/window/navigation.js#L55
    //
    // This test will always produce a console.error log, but it's expected due to above and the other assertions
    // are valid.
    const invoices = [{ sys: { id: 'invoice_1', invoiceDate: '2020-01-02' }, amount: 100 }];

    renderDashboard({ invoices });

    const row = screen.getByTestId('invoice-row');
    fireEvent.click(within(row).getByTestId('invoice-download-link'));

    await waitFor(() => expect(window.URL.revokeObjectURL).toBeCalled());

    expect(window.Blob).toBeCalledWith([mockInvoiceData], {
      type: 'application/pdf',
    });
    expect(window.URL.createObjectURL).toBeCalledWith(expect.any(window.Blob));
    expect(window.URL.revokeObjectURL).toBeCalledWith(expect.any(String));
  });

  it('should show the VAT number if given in the billing details', () => {
    const billingDetails = {
      vat: 'DE275148225',
    };

    renderDashboard({ billingDetails });

    expect(screen.getByTestId('vat').textContent).toBe(billingDetails.vat);
  });

  it('should show the second address if given in the billing details', () => {
    const billingDetails = {
      address2: '1234 Teststr.',
    };

    renderDashboard({ billingDetails });

    expect(screen.getByTestId('address2').textContent).toBe(billingDetails.address2);
  });

  it('should show the state if given in the billing details', () => {
    const billingDetails = {
      state: 'Florida',
    };

    renderDashboard({ billingDetails });

    expect(screen.getByTestId('state').textContent).toBe(billingDetails.state);
  });

  it('should format the payment details correctly', () => {
    const paymentDetails = {
      number: '************1234',
      expirationDate: {
        month: 9,
        year: 2099,
      },
    };

    renderDashboard({ paymentDetails });

    expect(screen.getByTestId('card-details').textContent).toBe(`**** **** **** 1234 09/2099`);
  });
});

function renderDashboard(custom) {
  const props = Object.assign(
    {
      loading: false,
      organizationId: mockOrganization.sys.id,
      orgIsSelfService: true,
      orgIsEnterprise: false,
      billingDetails: { address: {} },
      paymentDetails: { expirationDate: { month: 1 }, number: '' },
      onEditBillingDetails: () => {},
    },
    custom
  );

  render(
    <MemoryRouter>
      <Dashboard {...props} />
    </MemoryRouter>
  );
}
