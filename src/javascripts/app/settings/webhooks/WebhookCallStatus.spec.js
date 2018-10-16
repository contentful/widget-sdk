import React from 'react';
import Enzyme from 'enzyme';
import WebhookCallStatus from './WebhookCallStatus.es6';

describe('WebhookCallStatus', () => {
  const shallow = (code, error) => {
    const call = { errors: error ? [error] : undefined, statusCode: code };
    return Enzyme.shallow(<WebhookCallStatus call={call} />);
  };

  const testStatus = (wrapper, expected) => {
    expect(wrapper.find('.webhook-call__status-indicator').prop('data-status')).toBe(expected);
  };

  const testContent = (wrapper, expected) => {
    expect(wrapper.find('span').at(1)).toHaveText(expected);
  };

  it('shows green light when code < 300', () => {
    const wrapper = shallow(200);
    testStatus(wrapper, 'success');
  });

  it('shows yellow light when code >= 300 and code < 400', () => {
    const wrapper = shallow(301);
    testStatus(wrapper, 'warning');
  });

  it('shows red light if code >= 400', () => {
    const wrapper = shallow(500);
    testStatus(wrapper, 'failure');
  });

  it('shows red light if has both invalid code and some error', () => {
    const wrapper = shallow(400, 'TimeoutError');
    testStatus(wrapper, 'failure');
  });

  it('shows a label for errors', () => {
    const wrapper = shallow(undefined, 'TimeoutError');
    testContent(wrapper, 'Timeout');
  });

  it('shows a status code when available', () => {
    const wrapper = shallow(200);
    testContent(wrapper, 'HTTP 200');
  });

  it('shows a generic error label if unknown', () => {
    const wrapper = shallow(undefined, 'BlahBlahError');
    testContent(wrapper, 'Unknown error');
  });
});
