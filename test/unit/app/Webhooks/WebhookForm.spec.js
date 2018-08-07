import React from 'react';
import Enzyme from 'enzyme';
import WebhookForm from 'app/Webhooks/WebhookForm';

describe('WebhookForm', function () {
  const mount = () => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(<WebhookForm
      webhook={{}}
      hasHttpBasicStored={false}
      onChange={onChangeStub}
    />);

    return [wrapper, onChangeStub];
  };

  it('renders and updates details', function () {
    const [wrapper, onChangeStub] = mount();

    const name = wrapper.find('#webhook-name');
    const url = wrapper.find('#webhook-url');

    expect(name.prop('value')).toBe('');
    expect(url.prop('value')).toBe('');

    name.simulate('change', {target: {value: 'webhook'}});
    sinon.assert.calledWith(onChangeStub, {name: 'webhook'});
    url.simulate('change', {target: {value: 'http://test.com'}});
    const finalWebhook = {name: 'webhook', url: 'http://test.com'};
    sinon.assert.calledWith(onChangeStub, finalWebhook);
    expect(wrapper.state('webhook')).toEqual(finalWebhook);
  });

  it('renders and updates transformation properties', function () {
    const [wrapper, onChangeStub] = mount();

    const method = wrapper.find('#webhook-method');
    const contentType = wrapper.find('#webhook-content-type');

    expect(method.prop('value')).toBe('POST');
    expect(contentType.prop('value')).toBe('application/vnd.contentful.management.v1+json');

    contentType.simulate('change', {target: {value: 'application/json'}});
    sinon.assert.calledWith(onChangeStub, {transformation: {contentType: 'application/json'}});
    method.simulate('change', {target: {value: 'GET'}});
    const finalWebhook = {transformation: {contentType: 'application/json', method: 'GET'}};
    sinon.assert.calledWith(onChangeStub, finalWebhook);
    expect(wrapper.state('webhook')).toEqual(finalWebhook);
  });
});
