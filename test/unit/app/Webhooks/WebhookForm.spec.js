import React from 'react';
import Enzyme from 'enzyme';
import WebhookForm from 'app/Webhooks/WebhookForm.es6';

describe('WebhookForm', function() {
  let ServicesProvider;

  // We inject instead of importing so modalDialog is available
  beforeEach(function() {
    module('contentful/test');
    ServicesProvider = this.$inject('ServicesProvider');
  });

  const mount = () => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(
      <ServicesProvider>
        <WebhookForm webhook={{}} onChange={onChangeStub} />
      </ServicesProvider>
    );

    return [wrapper, onChangeStub];
  };

  it('renders and updates details', function() {
    const [wrapper, onChangeStub] = mount();

    const name = wrapper.find('#webhook-name');
    const url = wrapper.find('#webhook-url');

    expect(name.prop('value')).toBe('');
    expect(url.prop('value')).toBe('');

    name.simulate('change', { target: { value: 'webhook' } });
    sinon.assert.calledWith(onChangeStub, { name: 'webhook' });

    url.simulate('change', { target: { value: 'http://test.com' } });
    sinon.assert.calledWith(onChangeStub, { url: 'http://test.com' });
  });

  it('renders and updates transformation properties', function() {
    const [wrapper, onChangeStub] = mount();

    const method = wrapper.find('#webhook-method');
    const contentType = wrapper.find('#webhook-content-type');

    expect(method.prop('value')).toBe('POST');
    expect(contentType.prop('value')).toBe('application/vnd.contentful.management.v1+json');

    contentType.simulate('change', { target: { value: 'application/json' } });
    sinon.assert.calledWith(onChangeStub, { transformation: { contentType: 'application/json' } });

    wrapper.setProps({
      children: React.cloneElement(wrapper.props().children, {
        webhook: { transformation: { contentType: 'application/json' } }
      })
    });

    method.simulate('change', { target: { value: 'GET' } });
    const finalWebhook = { transformation: { contentType: 'application/json', method: 'GET' } };
    sinon.assert.calledWith(onChangeStub, finalWebhook);
  });
});
