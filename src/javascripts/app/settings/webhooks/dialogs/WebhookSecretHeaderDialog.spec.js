import React from 'react';
import Enzyme from 'enzyme';
import WebhookSecretHeaderDialog from './WebhookSecretHeaderDialog.es6';

describe('webhooks/dialogs/WebhookSecretHeaderDialog', () => {
  const selectors = {
    confirm: '[data-test-id="add-secret-header-button"]',
    cancel: '[data-test-id="close-secret-header-button"]',
    keyInput: 'input#secret-header-key',
    valueInput: 'input#secret-header-value'
  };

  const render = () => {
    const stubs = {
      onConfirm: jest.fn(),
      onCancel: jest.fn()
    };
    const wrapper = Enzyme.mount(
      <WebhookSecretHeaderDialog isShown onCancel={stubs.onCancel} onConfirm={stubs.onConfirm} />
    );
    return { wrapper, stubs };
  };

  it('confirm is disabled by default', () => {
    const { wrapper, stubs } = render();
    expect(wrapper.find(selectors.confirm)).toBeDisabled();
    wrapper.find(selectors.cancel).simulate('click');
    expect(stubs.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm is enabled when values are provided', () => {
    const { wrapper, stubs } = render();

    const key = 'some_key';
    const value = 'some_value';

    wrapper.find(selectors.keyInput).simulate('change', { target: { value: key } });
    wrapper.find(selectors.valueInput).simulate('change', { target: { value: value } });
    expect(wrapper.find(selectors.confirm)).not.toBeDisabled();

    wrapper.find(selectors.confirm).simulate('click');

    expect(stubs.onConfirm).toHaveBeenCalledWith({
      key,
      value
    });
  });

  it('has correct text', () => {
    const { wrapper } = render();
    expect(wrapper).toIncludeText(
      'Values of secret headers are only used when calling the Webhook URL. They are hidden in the Web App, API responses and logs. To modify a secret header you need to remove and recreate it.'
    );
    expect(wrapper.find(selectors.confirm)).toHaveText('Add secret header');
  });
});
