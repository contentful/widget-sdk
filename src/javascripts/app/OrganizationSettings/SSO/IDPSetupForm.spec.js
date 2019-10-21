import React from 'react';
import Enzyme from 'enzyme';
import { IDPSetupForm } from './IDPSetupForm.es6';
import { TEST_RESULTS } from './constants.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { track } from 'analytics/Analytics';

import { connectionTestingAllowed, formatConnectionTestErrors } from './utils.es6';

const awaitSetImmediate = () => new Promise(resolve => setImmediate(resolve));

jest.mock('./utils.es6', () => ({
  connectionTestingAllowed: jest.fn(),
  formatConnectionTestErrors: jest.fn().mockReturnValue([])
}));

jest.mock('Config.es6', () => ({
  authUrl: path => `https://be.joistio.com${path}`
}));

describe('IDPSetupForm', () => {
  let identityProvider;
  let globalMocks;

  const render = ({
    identityProvider,
    organization,
    updateFieldValue = () => {},
    validateField = () => {},
    connectionTestStart = () => {},
    connectionTestCancel = () => {},
    enable = () => {},
    connectionTest = {},
    fields = {
      idpName: {},
      ssoName: {},
      idpSsoTargetUrl: {},
      idpCert: {}
    }
  }) => {
    return Enzyme.shallow(
      <IDPSetupForm
        organization={organization}
        identityProvider={identityProvider}
        updateFieldValue={updateFieldValue}
        validateField={validateField}
        fields={fields}
        connectionTest={connectionTest}
        connectionTestStart={connectionTestStart}
        connectionTestCancel={connectionTestCancel}
        enable={enable}
      />
    );
  };

  const organization = {
    name: 'My Awesome Org',
    sys: {
      id: 'org_1234'
    }
  };

  beforeEach(() => {
    identityProvider = {
      sys: {
        version: 1
      }
    };

    global.open = jest.fn();

    globalMocks = {
      open: global.open,
      addEventListener: jest.spyOn(global, 'addEventListener'),
      removeEventListener: jest.spyOn(global, 'removeEventListener'),
      setInterval: jest.spyOn(global, 'setInterval'),
      clearInterval: jest.spyOn(global, 'clearInterval')
    };
  });

  afterEach(() => {
    globalMocks.addEventListener.mockRestore();
    globalMocks.removeEventListener.mockRestore();
    globalMocks.setInterval.mockRestore();
    globalMocks.clearInterval.mockRestore();

    connectionTestingAllowed.mockClear();
    formatConnectionTestErrors.mockClear();

    track.mockClear();
  });

  it('should validate a field on every change', () => {
    const validateField = jest.fn();

    const rendered = render({ identityProvider, organization, validateField });

    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'li' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lill' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lilly' } });

    expect(validateField).toHaveBeenCalledTimes(3);
  });

  it('should update a field every 500ms on change', async () => {
    const updateFieldValue = jest.fn();

    const rendered = render({ identityProvider, organization, updateFieldValue });

    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'li' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lill' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lilly' } });

    expect(updateFieldValue).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 550));

    expect(updateFieldValue).toHaveBeenCalledTimes(1);
  });

  it('should update a field immediately if input is blurred', () => {
    const updateFieldValue = jest.fn();

    const rendered = render({ identityProvider, organization, updateFieldValue });

    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('blur', { target: { value: 'lilly' } });

    expect(updateFieldValue).toHaveBeenCalledTimes(1);
  });

  it('should not allow testing the connection if connectionTestingAllowed returns false', () => {
    connectionTestingAllowed.mockReturnValueOnce(false);

    const rendered = render({ identityProvider, organization });

    const testConnectionButton = rendered.find('[testId="test-connection-button"]').first();

    expect(testConnectionButton.prop('disabled')).toBe(true);
  });

  it('should allow testing the connection if connectionTestingAllowed returns true', () => {
    connectionTestingAllowed.mockReturnValueOnce(true);

    const rendered = render({ identityProvider, organization });

    const testConnectionButton = rendered.find('[testId="test-connection-button"]').first();

    expect(testConnectionButton.prop('disabled')).toBe(false);
  });

  it('should call the connectionTestStart prop if the test connection button is clicked', () => {
    connectionTestingAllowed.mockReturnValueOnce(true);

    const connectionTestStart = jest.fn();

    const rendered = render({ identityProvider, organization, connectionTestStart });

    rendered
      .find('[testId="test-connection-button"]')
      .first()
      .simulate('click');

    expect(connectionTestStart).toHaveBeenCalledTimes(1);
  });

  it('should show a cancel button if the connection test is pending', () => {
    const connectionTest = {
      isPending: true
    };

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(rendered.find('[testId="cancel-button"]')).toHaveLength(1);
  });

  it('should call the connectionTestCancel prop if the test cancel button is clicked', () => {
    const connectionTest = {
      isPending: true
    };

    const connectionTestCancel = jest.fn();

    const rendered = render({
      identityProvider,
      organization,
      connectionTest,
      connectionTestCancel
    });

    rendered
      .find('[testId="cancel-button"]')
      .first()
      .simulate('click');

    expect(connectionTestCancel).toHaveBeenCalledTimes(1);
  });

  it('should show the unknown note if the result is unknown', () => {
    const connectionTest = {
      timestamp: 'timestamp',
      result: null
    };

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(rendered.find('[testId="result-unknown-note"]')).toHaveLength(1);
  });

  it('should show the failure note if the result is failure', () => {
    const connectionTest = {
      result: TEST_RESULTS.failure,

      // TODO: ensure that this is handled in the reducer AND add proptype for connectionTest
      errors: []
    };

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(rendered.find('[testId="result-failure-note"]')).toHaveLength(1);
  });

  it('should show the success note if the result is successful', () => {
    const connectionTest = {
      result: TEST_RESULTS.success
    };

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(rendered.find('[testId="result-success-note"]')).toHaveLength(1);
  });

  it('should show formatted errors to the user if the result is failure', () => {
    const connectionTest = {
      result: TEST_RESULTS.failure,
      errors: ['something bad happened', 'another error']
    };

    const formattedErrs = ['Formatted err 1', 'Formatted err 2'];

    formatConnectionTestErrors.mockReturnValueOnce(formattedErrs);

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(formatConnectionTestErrors).toHaveBeenCalledTimes(1);
    expect(formatConnectionTestErrors).toHaveBeenNthCalledWith(1, connectionTest.errors);

    expect(rendered.find('[testId="errors"]')).toHaveLength(1);
    expect(rendered.find('[testId="errors"]').prop('value')).toBe(formattedErrs.join('\n'));
  });

  it('should not show the errors or note if present if the connection test is pending', () => {
    const connectionTest = {
      isPending: true,
      result: TEST_RESULTS.failure,
      errors: ['something bad happened', 'another error']
    };

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(rendered.find('[testId="result-failure-note"]')).toHaveLength(0);
    expect(rendered.find('[testId="errors"]')).toHaveLength(0);
  });

  it('should not attempt to enable if the modal is not confirmed', async () => {
    ModalLauncher.open.mockResolvedValueOnce(false);

    const enable = jest.fn();
    const connectionTest = {
      result: TEST_RESULTS.success
    };

    const rendered = render({ identityProvider, organization, connectionTest, enable });

    rendered
      .find('[testId="enable-button"]')
      .first()
      .simulate('click');

    await awaitSetImmediate();

    expect(enable).not.toHaveBeenCalled();
  });

  it('should attempt to enable if the modal is confirmed', async () => {
    ModalLauncher.open.mockResolvedValueOnce(true);

    const enable = jest.fn();
    const connectionTest = {
      result: TEST_RESULTS.success
    };

    const rendered = render({ identityProvider, organization, connectionTest, enable });

    rendered
      .find('[testId="enable-button"]')
      .first()
      .simulate('click');

    await awaitSetImmediate();

    expect(enable).toHaveBeenCalledTimes(1);
    expect(enable).toHaveBeenNthCalledWith(1, { orgId: organization.sys.id });
  });

  it('should track when a user clicks on the support link', () => {
    const rendered = render({ identityProvider, organization });

    rendered
      .find('[testId="support-link"]')
      .first()
      .simulate('click');

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(1, 'sso:contact_support');
  });
});
