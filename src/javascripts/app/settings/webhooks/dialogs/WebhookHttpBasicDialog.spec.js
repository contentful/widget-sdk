import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import WebhookHttpBasicDialog from './WebhookHttpBasicDialog.es6';
import base64safe from '../base64safe.es6';

describe('webhooks/dialogs/WebhookHttpBasicDialog', () => {
  const selectors = {
    confirm: '[data-test-id="add-http-header-button"]',
    cancel: '[data-test-id="close-add-http-header-dialog-button"]',
    userInput: 'input#http-basic-user',
    passwordInput: 'input#http-basic-password'
  };

  const render = () => {
    const stubs = {
      onConfirm: sinon.stub(),
      onCancel: sinon.stub()
    };
    const wrapper = Enzyme.mount(
      <WebhookHttpBasicDialog isShown onCancel={stubs.onCancel} onConfirm={stubs.onConfirm} />
    );
    return { wrapper, stubs };
  };

  it('confirm is disabled by default', () => {
    const { wrapper, stubs } = render();
    expect(wrapper.find(selectors.confirm)).toBeDisabled();
    wrapper.find(selectors.cancel).simulate('click');
    expect(stubs.onCancel.calledOnce).toBe(true);
  });

  it('confirm is enabled when values are provided', () => {
    const { wrapper, stubs } = render();

    const user = 'angela_merkel';
    const password = '12345';

    wrapper.find(selectors.userInput).simulate('change', { target: { value: user } });
    wrapper.find(selectors.passwordInput).simulate('change', { target: { value: password } });
    expect(wrapper.find(selectors.confirm)).not.toBeDisabled();

    wrapper.find(selectors.confirm).simulate('click');

    expect(stubs.onConfirm.getCall(0).args).toEqual([
      {
        key: 'Authorization',
        value: 'Basic ' + base64safe([user || '', password || ''].join(':'))
      }
    ]);
  });

  it('has correct text', () => {
    const { wrapper } = render();
    expect(wrapper).toIncludeText(
      'This form will automatically generate a secure Authorization header containing correctly formated HTTP Basic Auth information.'
    );
    expect(wrapper).toIncludeText(
      'Some APIs require only the username or only the password, so the form can be confirmed with only one value provided.'
    );

    expect(wrapper.find(selectors.confirm)).toHaveText('Add HTTP Basic Auth header');
  });
});
