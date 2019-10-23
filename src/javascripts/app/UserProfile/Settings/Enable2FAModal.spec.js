import React from 'react';
import { render, cleanup, fireEvent, within, wait } from '@testing-library/react';
import { Notification } from '@contentful/forma-36-react-components';
import Enable2FAModal from './Enable2FAModal';
import { enableTotp } from './AccountRepository';
import { createQRCodeDataURI } from './utils';

import '@testing-library/jest-dom/extend-expect';

jest.mock('./utils', () => ({
  createQRCodeDataURI: jest.fn()
}));

jest.mock('./AccountRepository', () => ({
  enableTotp: jest.fn()
}));

describe('Enable2FAModal', () => {
  const makeTotp = custom => {
    return Object.assign(
      {
        secret: 'SECRET_ABCD',
        enabled: false,
        provisioningUri: 'optauth://totp/Contentful:test@example.com?secret=SECRET_ABCD'
      },
      custom
    );
  };

  const build = custom => {
    const props = Object.assign(
      {
        totp: makeTotp(),
        onConfirm: () => {},
        onCancel: () => {}
      },
      custom
    );

    return render(<Enable2FAModal isShown {...props} />);
  };

  afterEach(cleanup);

  it('should create a QR code data URI with totp.provisioningUri', () => {
    const totp = makeTotp();

    build({ totp });

    expect(createQRCodeDataURI).toHaveBeenCalledWith(totp.provisioningUri);
  });

  it('should show an image with the QR code data URI', () => {
    const exampleURI = 'datauri://example';

    createQRCodeDataURI.mockReturnValueOnce(exampleURI);

    const { queryByTestId } = build();

    expect(queryByTestId('qrcode')).toHaveAttribute('src', exampleURI);
  });

  it('should call enableTotp with the inputted code on submit', () => {
    const { queryByTestId } = build();

    const input = queryByTestId('code-input').querySelector('input');

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(queryByTestId('submit'));

    expect(enableTotp).toHaveBeenCalledWith('123456');
  });

  it('should set both buttons as disabled when submitting', () => {
    const { queryByTestId } = build();

    const input = queryByTestId('code-input').querySelector('input');
    const submitButton = queryByTestId('submit');
    const cancelButton = queryByTestId('cancel');

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    expect(submitButton).toHaveAttribute('disabled');
    expect(cancelButton).toHaveAttribute('disabled');
  });

  it('should show a validation message and enable the buttons if enableTotp rejects', async () => {
    enableTotp.mockRejectedValueOnce();

    const { queryByTestId } = build();

    const codeField = queryByTestId('code-input');
    const input = codeField.querySelector('input');

    const submitButton = queryByTestId('submit');
    const cancelButton = queryByTestId('cancel');

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await wait();

    const helpText = within(codeField).queryByTestId('cf-ui-validation-message').textContent;

    expect(helpText).toEqual(expect.any(String));
    expect(submitButton).not.toHaveAttribute('disabled');
    expect(cancelButton).not.toHaveAttribute('disabled');
  });

  it('should not call onConfirm if enableTotp rejects', async () => {
    enableTotp.mockRejectedValueOnce();

    const onConfirm = jest.fn();
    const { queryByTestId } = build({ onConfirm });

    const codeField = queryByTestId('code-input');
    const input = codeField.querySelector('input');

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(queryByTestId('submit'));

    await wait();

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm and show a notification if enableTotp resolves', async () => {
    const notificationSuccessSpy = jest
      .spyOn(Notification, 'success')
      .mockImplementationOnce(() => {});

    enableTotp.mockResolvedValueOnce();

    const onConfirm = jest.fn();
    const { queryByTestId } = build({ onConfirm });

    const codeField = queryByTestId('code-input');
    const input = codeField.querySelector('input');

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(queryByTestId('submit'));

    await wait();

    expect(onConfirm).toHaveBeenCalled();
    expect(notificationSuccessSpy).toHaveBeenCalled();

    notificationSuccessSpy.mockRestore();
  });
});
