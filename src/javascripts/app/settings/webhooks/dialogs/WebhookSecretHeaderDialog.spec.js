import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup, fireEvent } from 'react-testing-library';
import WebhookSecretHeaderDialog from './WebhookSecretHeaderDialog.es6';

const selectors = {
  confirmTestId: 'add-secret-header-button',
  cancelTestId: 'close-secret-header-button'
};

describe('webhooks/dialogs/WebhookSecretHeaderDialog', () => {
  afterEach(cleanup);

  const renderComponent = () => {
    const stubs = {
      onConfirm: jest.fn(),
      onCancel: jest.fn()
    };
    const wrapper = render(
      <WebhookSecretHeaderDialog isShown onCancel={stubs.onCancel} onConfirm={stubs.onConfirm} />
    );
    return [wrapper, stubs];
  };

  it('confirm is disabled by default', () => {
    const [{ getByTestId }, stubs] = renderComponent();
    expect(getByTestId(selectors.confirmTestId)).toBeDisabled();
    fireEvent.click(getByTestId(selectors.cancelTestId));
    expect(stubs.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm is enabled when values are provided', () => {
    const [{ getByLabelText, getByTestId }, stubs] = renderComponent();

    const key = 'some_key';
    const value = 'some_value';

    fireEvent.change(getByLabelText('Key', { exact: false }), { target: { value: key } });
    fireEvent.change(getByLabelText('Value', { exact: false }), { target: { value: value } });

    fireEvent.click(getByTestId(selectors.confirmTestId));

    expect(stubs.onConfirm).toHaveBeenCalledWith({
      key,
      value
    });
  });
});
