import React from 'react';
import Enzyme from 'enzyme';

describe('WebhookList', function () {
  let WebhookList;

  const webhookRepo = {logs: {getHealth: sinon.stub().rejects()}};
  const resource = {};
  const organization = {};

  const mount = webhooks => {
    return Enzyme.mount(<WebhookList
      webhooks={webhooks}
      webhookRepo={webhookRepo}
      resource={resource}
      organization={organization}
    />);
  };

  // We inject instead of importing so UI Router's $state is available
  beforeEach(function () {
    module('contentful/test');
    WebhookList = this.$inject('app/Webhooks/WebhookList').default;
  });

  it('renders empty list of webhooks', function () {
    const wrapper = mount([]);
    const rows = wrapper.find('.table__body tbody tr');
    expect(rows.length).toBe(1);
    expect(rows.find('td').text()).toBe('No webhooks yet!');
  });

  it('renders non-empty list of webhooks', function () {
    const wh1 = {name: 'wh1', url: 'http://test.com', sys: {id: 'wh1'}};
    const wh2 = {name: 'wh2', url: 'http://google.com', transformation: {method: 'PUT'}, sys: {id: 'wh2'}};
    const wrapper = mount([wh1, wh2]);

    const rows = wrapper.find('.table__body tbody tr');
    expect(rows.length).toBe(2);
    expect(rows.find('td').first().text()).toBe('wh1');

    const urls = rows.find('code');
    expect(urls.at(0).text()).toBe('POST http://test.com');
    expect(urls.at(1).text()).toBe('PUT http://google.com');
  });
});
