import React from 'react';

import { render, fireEvent } from '@testing-library/react';
import WebhookHttpBasicDialog from './WebhookHttpBasicDialog';
import base64safe from '../base64safe';

describe('webhooks/dialogs/WebhookHttpBasicDialog', () => {
  const renderComponent = () => {
    const stubs = {
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
    };
    return [
      render(
        <WebhookHttpBasicDialog isShown onCancel={stubs.onCancel} onConfirm={stubs.onConfirm} />
      ),
      stubs,
    ];
  };

  it('confirm is disabled by default', () => {
    const [{ getByTestId }, stubs] = renderComponent();
    expect(getByTestId('add-http-header-button')).toBeDisabled();
    fireEvent.click(getByTestId('close-add-http-header-dialog-button'));
    expect(stubs.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm is enabled when values are provided', () => {
    const [{ getByLabelText, getByTestId }, stubs] = renderComponent();

    const user = 'angela_merkel';
    const password = '12345';

    fireEvent.change(getByLabelText('User'), { target: { value: user } });
    fireEvent.change(getByLabelText('Password'), { target: { value: password } });

    const confirmButton = getByTestId('add-http-header-button');

    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    expect(stubs.onConfirm).toHaveBeenCalledWith({
      key: 'Authorization',
      value: 'Basic ' + base64safe([user || '', password || ''].join(':')),
    });
  });
});
