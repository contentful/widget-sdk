import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import WebhookForm from './WebhookForm.es6';

const MockedProvider = require('../../../reactServiceContext').MockedProvider;

describe('WebhookForm', () => {
  const mount = () => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(
      <MockedProvider
        services={{
          modalDialog: {
            open: () => {}
          }
        }}>
        <WebhookForm webhook={{}} onChange={onChangeStub} />
      </MockedProvider>
    );

    return [wrapper, onChangeStub];
  };

  it('renders and updates details', () => {
    const [wrapper, onChangeStub] = mount();

    const name = wrapper.find('#webhook-name');
    const url = wrapper.find('#webhook-url');

    expect(name.prop('value')).toBe('');
    expect(url.prop('value')).toBe('');

    name.simulate('change', { target: { value: 'webhook' } });
    expect(onChangeStub.calledWith({ name: 'webhook' })).toBeTruthy();

    url.simulate('change', { target: { value: 'http://test.com' } });
    expect(onChangeStub.calledWith({ url: 'http://test.com' })).toBeTruthy();
  });

  it('renders and updates transformation properties', () => {
    const [wrapper, onChangeStub] = mount();

    const method = wrapper.find('#webhook-method');
    const contentType = wrapper.find('#webhook-content-type');

    expect(method.prop('value')).toBe('POST');
    expect(contentType.prop('value')).toBe('application/vnd.contentful.management.v1+json');

    contentType.simulate('change', { target: { value: 'application/json' } });
    expect(
      onChangeStub.calledWith({
        transformation: { contentType: 'application/json' }
      })
    ).toBeTruthy();

    wrapper.setProps({
      children: React.cloneElement(wrapper.props().children, {
        webhook: { transformation: { contentType: 'application/json' } }
      })
    });

    method.simulate('change', { target: { value: 'GET' } });
    const finalWebhook = { transformation: { contentType: 'application/json', method: 'GET' } };
    expect(onChangeStub.calledWith(finalWebhook)).toBeTruthy();
  });
});
