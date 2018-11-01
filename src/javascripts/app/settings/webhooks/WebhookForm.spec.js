import React from 'react';
import Enzyme from 'enzyme';
import WebhookForm from './WebhookForm.es6';

describe('WebhookForm', () => {
  const mount = () => {
    const onChangeStub = jest.fn();
    const wrapper = Enzyme.mount(<WebhookForm webhook={{}} onChange={onChangeStub} />);

    return [wrapper, onChangeStub];
  };

  it('renders and updates details', () => {
    const [wrapper, onChangeStub] = mount();

    const name = wrapper.find('#webhook-name');
    const url = wrapper.find('#webhook-url');

    expect(name.prop('value')).toBe('');
    expect(url.prop('value')).toBe('');

    name.simulate('change', { target: { value: 'webhook' } });
    expect(onChangeStub).toHaveBeenCalledWith({ name: 'webhook' });

    url.simulate('change', { target: { value: 'http://test.com' } });
    expect(onChangeStub).toHaveBeenCalledWith({ url: 'http://test.com' });
  });

  it('renders and updates transformation properties', () => {
    const [wrapper, onChangeStub] = mount();

    const method = wrapper.find('#webhook-method');
    const contentType = wrapper.find('#webhook-content-type');

    expect(method.prop('value')).toBe('POST');
    expect(contentType.prop('value')).toBe('application/vnd.contentful.management.v1+json');

    contentType.simulate('change', { target: { value: 'application/json' } });
    expect(onChangeStub).toHaveBeenCalledWith({
      transformation: { contentType: 'application/json' }
    });

    wrapper.setProps({
      webhook: { transformation: { contentType: 'application/json' } }
    });

    method.simulate('change', { target: { value: 'GET' } });
    const finalWebhook = { transformation: { contentType: 'application/json', method: 'GET' } };
    expect(onChangeStub).toHaveBeenCalledWith(finalWebhook);
  });
});
