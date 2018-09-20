import React from 'react';
import Enzyme from 'enzyme';
import WebhookList from 'app/Webhooks/WebhookList.es6';

describe('WebhookList', function() {
  let ServicesProvider;

  beforeEach(function() {
    module('contentful/test');
    ServicesProvider = this.$inject('ServicesProvider');
  });

  const webhookRepo = { logs: { getHealth: sinon.stub().rejects() } };

  const mount = (webhooks, forbidden) => {
    return Enzyme.mount(
      <ServicesProvider>
        <WebhookList
          webhooks={webhooks}
          webhookRepo={webhookRepo}
          openTemplateDialog={() => {}}
          forbidden={forbidden}
        />
      </ServicesProvider>
    );
  };

  it('renders "forbidden" view', function() {
    const wrapper = mount([], <div id="forbidden-view" />);

    expect(wrapper.find('#forbidden-view').exists()).toBe(true);
    expect(wrapper.find('.table__body').exists()).toBe(false);
  });

  it('renders empty list of webhooks', function() {
    const wrapper = mount([]);
    const rows = wrapper.find('.table__body tbody tr');
    expect(rows.length).toBe(1);
    expect(rows.find('td').text()).toBe('Add a webhook, then manage it in this space.');
  });

  it('renders non-empty list of webhooks', function() {
    const wh1 = { name: 'wh1', url: 'http://test.com', sys: { id: 'wh1' } };
    const wh2 = {
      name: 'wh2',
      url: 'http://google.com',
      transformation: { method: 'PUT' },
      sys: { id: 'wh2' }
    };
    const wrapper = mount([wh1, wh2]);

    const rows = wrapper.find('.table__body tbody tr');
    expect(rows.length).toBe(2);
    expect(
      rows
        .find('td')
        .first()
        .text()
    ).toBe('wh1');

    const urls = rows.find('code');
    expect(urls.at(0).text()).toBe('POST http://test.com');
    expect(urls.at(1).text()).toBe('PUT http://google.com');
  });
});
