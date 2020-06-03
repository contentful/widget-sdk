import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmScreenPartnerPlan from './ConfirmScreenPartnerPlan';
import * as Fake from 'test/helpers/fakeFactory';

const mockOrganization = Fake.Organization();

describe('ConfirmScreenPartnerPlan', () => {
  it('should show the template copy if a template is selected', () => {
    build({ selectedTemplate: { name: 'a template' } });

    expect(screen.getByTestId('body')).toHaveTextContent(
      'and we will fill it with example content'
    );
  });

  it('should call onChangePartnerDetails when any of the fields change', () => {
    const onChangePartnerDetails = jest.fn();
    build({ onChangePartnerDetails });

    userEvent.type(
      within(screen.getByTestId('client-name')).getByTestId('cf-ui-text-input'),
      'A client name'
    );

    expect(onChangePartnerDetails).toBeCalledWith('clientName', 'A client name');

    userEvent.type(
      within(screen.getByTestId('description')).getByTestId('cf-ui-text-input'),
      'A project description'
    );

    expect(onChangePartnerDetails).toBeCalledWith('projectDescription', 'A project description');

    // There's no simple and clean way to test the date picker at the unit test level. We would have to hardcode some
    // things into this test about the date picker, which would feel a bit leaky. Instead, we trust that the date
    // picker works and that it will fire an event like above with `estimatedDeliveryDate` and the selected date.
  });

  it('should disable the submit button if the client name is not provided', () => {
    build();

    expect(screen.getByTestId('confirm-button')).toHaveAttribute('disabled');
  });

  it('should disable the submit button if the project description is not provided', () => {
    build({
      partnerDetails: {
        clientName: 'A client name',
        projectDescription: '',
        estimatedDeliveryDate: '2020-06-03',
      },
    });

    expect(screen.getByTestId('confirm-button')).toHaveAttribute('disabled');
  });

  it('should disable the submit button if the estimated delivery date is not provided', () => {
    build({
      partnerDetails: {
        clientName: 'A client name',
        projectDescription: 'Some project',
        estimatedDeliveryDate: '',
      },
    });

    expect(screen.getByTestId('confirm-button')).toHaveAttribute('disabled');
  });

  it('should disable the submit button if creating is true', () => {
    build({
      creating: true,
      partnerDetails: {
        clientName: 'Cyberdyne Systems',
        projectDescription: 'Skynet',
        estimatedDeliveryDate: '2099-06-03',
      },
    });

    expect(screen.getByTestId('confirm-button')).toHaveAttribute('disabled');
  });

  it('should call onConfirm if the submit button is pressed', () => {
    const onConfirm = jest.fn();

    build({
      onConfirm,
      partnerDetails: {
        clientName: 'Cyberdyne Systems',
        projectDescription: 'Skynet',
        estimatedDeliveryDate: '2099-06-03',
      },
    });

    userEvent.click(screen.getByTestId('confirm-button'));

    expect(onConfirm).toBeCalled();
  });
});

function build(custom) {
  const props = Object.assign(
    {
      selectedTemplate: null,
      creating: false,
      onConfirm: () => {},
      organization: mockOrganization,
      spaceName: 'Space name',
      onChangePartnerDetails: () => {},
      partnerDetails: {
        clientName: '',
        projectDescription: '',
        estimatedDeliveryDate: '',
      },
    },
    custom
  );

  render(<ConfirmScreenPartnerPlan {...props} />);
}
