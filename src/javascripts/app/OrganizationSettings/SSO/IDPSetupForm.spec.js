import React from 'react';
import Enzyme from 'enzyme';
import { IDPSetupForm } from './IDPSetupForm.es6';
import { TEST_RESULTS } from './constants.es6';
import { authUrl } from 'Config.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import { connectionTestingAllowed } from './utils.es6';

const awaitSetImmediate = () => new Promise(resolve => setImmediate(resolve));

jest.mock('./utils.es6', () => ({
  connectionTestingAllowed: jest.fn()
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
    connectionTestResult = () => {},
    connectionTestEnd = () => {},
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
        connectionTestResult={connectionTestResult}
        connectionTestEnd={connectionTestEnd}
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

  it('should show a cancel button if the connection test is pending', () => {
    const connectionTest = {
      isPending: true
    };

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(rendered.find('[testId="cancel-button"]')).toHaveLength(1);
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

  it('should show the errors to the user if the result is failure', () => {
    const connectionTest = {
      result: TEST_RESULTS.failure,
      errors: ['something bad happened', 'another error']
    };

    const rendered = render({ identityProvider, organization, connectionTest });

    expect(rendered.find('[testId="errors"]')).toHaveLength(1);
    expect(rendered.find('[testId="errors"]').prop('value')).toBe(connectionTest.errors.join('\n'));
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
    }

    const rendered = render({ identityProvider, organization, connectionTest, enable });

    rendered.find('[testId="enable-button"]').first().simulate('click');

    await awaitSetImmediate();

    expect(enable).not.toHaveBeenCalled();
  });

  it('should attempt to enable if the modal is confirmed', async () => {
    ModalLauncher.open.mockResolvedValueOnce(true);

    const enable = jest.fn();
    const connectionTest = {
      result: TEST_RESULTS.success
    }

    const rendered = render({ identityProvider, organization, connectionTest, enable });

    rendered.find('[testId="enable-button"]').first().simulate('click');

    await awaitSetImmediate();

    expect(enable).toHaveBeenCalledTimes(1);
    expect(enable).toHaveBeenNthCalledWith(1, { orgId: organization.sys.id });
  });

  describe('connection testing flow', () => {
    let rendered;
    let testButton;
    let connectionTestStart;
    let connectionTestResult;
    let connectionTestEnd;
    let connectionTestCancel;
    let connectionTest;
    let win;
    let timer;

    beforeEach(() => {
      win = {
        close: jest.fn()
      };
      timer = '123';
      globalMocks.open.mockReturnValueOnce(win);
      globalMocks.setInterval.mockReturnValueOnce(timer);

      connectionTest = {
        isPending: true
      };

      connectionTestStart = jest.fn();
      connectionTestResult = jest.fn();
      connectionTestEnd = jest.fn();
      connectionTestCancel = jest.fn();

      connectionTestingAllowed.mockReturnValueOnce(true);
      rendered = render({
        identityProvider,
        organization,
        connectionTest,
        connectionTestStart,
        connectionTestResult,
        connectionTestEnd,
        connectionTestCancel
      });

      testButton = rendered.find('[testId="test-connection-button"]').first();
    });

    describe('starting the test', () => {
      beforeEach(() => {
        globalMocks.setInterval.mockReturnValueOnce(timer);

        testButton.simulate('click');
      });

      it('should open a new window to the sso url when the button is clicked', () => {
        expect(globalMocks.open).toBeCalledTimes(1);
        expect(globalMocks.open).toHaveBeenNthCalledWith(
          1,
          authUrl(`/sso/${organization.sys.id}/test_connection`),
          expect.any(String),
          expect.any(String)
        );
      });

      it('should start an interval to check the window every 250ms', () => {
        expect(globalMocks.setInterval).toBeCalledTimes(1);
        expect(globalMocks.setInterval).toHaveBeenNthCalledWith(1, expect.any(Function), 250);
      });

      it('should set up a message event listener', () => {
        expect(globalMocks.addEventListener).toHaveBeenCalledTimes(1);
        expect(globalMocks.addEventListener).toHaveBeenNthCalledWith(
          1,
          'message',
          expect.any(Function)
        );
      });

      it('should should set the component state with the new window, timer id, and reset messageHandled', () => {
        expect(rendered.state('testConnectionTimer')).toBe(timer);
        expect(rendered.state('newWindow')).toBe(win);
        expect(rendered.state('messageHandled')).toBe(false);
      });

      it('should fire the connectionTestStart action', () => {
        expect(connectionTestStart).toHaveBeenCalledTimes(1);
      });
    });

    describe('message fired from new window', () => {
      let data;

      beforeEach(() => {
        data = {
          testConnectionAt: null
        };

        testButton.simulate('click');
      });

      it('should mark the message as handled in the state', () => {
        global.dispatchEvent(new MessageEvent('message', { data }));
        expect(rendered.state('messageHandled')).toBe(true);
      });

      it('should fire connectionTestResult if the data contains a timestamp', () => {
        data.testConnectionAt = 'timestamp';
        global.dispatchEvent(new MessageEvent('message', { data }));

        expect(connectionTestResult).toHaveBeenCalledTimes(1);
      });

      it('should fire connectionTestEnd if the data does not contain a timestamp', () => {
        global.dispatchEvent(new MessageEvent('message', { data }));
        expect(connectionTestEnd).toHaveBeenCalledTimes(1);
      });
    });

    describe('new window closed unexpectedly', () => {
      beforeEach(async () => {
        global.setInterval.mockRestore();

        testButton.simulate('click');
        win.closed = true;

        await new Promise(resolve => setTimeout(resolve, 250));
      });

      it('should clear the timer that checks the window', () => {
        expect(globalMocks.clearInterval).toHaveBeenCalledTimes(1);
      });

      it('should fire the testConnectionEnd action', () => {
        expect(connectionTestEnd).toHaveBeenCalledTimes(1);
      });
    });

    describe('test is canceled', () => {
      beforeEach(() => {
        testButton.simulate('click');
        rendered
          .find('[testId="cancel-button"]')
          .first()
          .simulate('click');
      });

      it('should close the new window', () => {
        expect(win.close).toHaveBeenCalledTimes(1);
      });

      it('should clear the timer that checks the window', () => {
        expect(globalMocks.clearInterval).toHaveBeenCalledTimes(1);
        expect(globalMocks.clearInterval).toHaveBeenNthCalledWith(1, timer);
      });

      it('should remove the event listener for message', () => {
        expect(globalMocks.removeEventListener).toHaveBeenCalledTimes(1);
        expect(globalMocks.removeEventListener).toHaveBeenNthCalledWith(
          1,
          'message',
          expect.any(Function)
        );
      });

      it('should unset the window and timer in the state', () => {
        expect(rendered.state('newWindow')).toBeUndefined();
        expect(rendered.state('testConnectionTimer')).toBeUndefined();
      });

      it('should fire the connectionTestCancel action', () => {
        expect(connectionTestCancel).toHaveBeenCalledTimes(1);
      });
    });
  });
});
