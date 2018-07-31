import React from 'react';
import Enzyme from 'enzyme';
import WebhookCallStatus from 'app/Webhooks/WebhookCallStatus';

describe('WebhookCallStatus', function () {
  const mount = (code, error) => {
    const call = {errors: error ? [error] : undefined, statusCode: code};
    return Enzyme.mount(<WebhookCallStatus call={call} />);
  };

  const testStatus = (wrapper, expected) => {
    expect(wrapper.find('.webhook-call__status-indicator').prop('data-status')).toBe(expected);
  };

  const testContent = (wrapper, expected) => {
    expect(wrapper.find('span').at(1).text()).toBe(expected);
  };

  it('shows green light when code < 300', function () {
    const wrapper = mount(200);
    testStatus(wrapper, 'success');
  });

  it('shows yellow light when code >= 300 and code < 400', function () {
    const wrapper = mount(301);
    testStatus(wrapper, 'warning');
  });

  it('shows red light if code >= 400', function () {
    const wrapper = mount(500);
    testStatus(wrapper, 'failure');
  });

  it('shows red light if has some error', function () {
    const wrapper = mount(undefined, 'TimeoutError');
    testStatus(wrapper, 'failure');
  });

  it('shows red light if has both invalid code and some error', function () {
    const wrapper = mount(400, 'TimeoutError');
    testStatus(wrapper, 'failure');
  });

  it('shows a label for errors', function () {
    const wrapper = mount(undefined, 'TimeoutError');
    testContent(wrapper, 'Timeout');
  });

  it('shows a status code when available', function () {
    const wrapper = mount(200);
    testContent(wrapper, 'HTTP 200');
  });

  it('shows a generic error label if unknown', function () {
    const wrapper = mount(undefined, 'BlahBlahError');
    testContent(wrapper, 'Unknown error');
  });
});
