import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import WebhookList from '../WebhookList.es6';

const MockedProvider = require('../../../reactServiceContext').MockedProvider;

describe('WebhookList', () => {
  const webhookRepo = { logs: { getHealth: sinon.stub().rejects() } };

  const mount = (webhooks, forbidden) => {
    return Enzyme.mount(
      <MockedProvider
        services={{
          $state: {
            go: () => {}
          },
          'utils/ResourceUtils.es6': {
            isLegacyOrganization: () => false
          }
        }}>
        <WebhookList
          webhooks={webhooks}
          webhookRepo={webhookRepo}
          openTemplateDialog={() => {}}
          forbidden={forbidden}
        />
      </MockedProvider>
    );
  };

  it('renders "forbidden" view', () => {
    const wrapper = mount([], <div id="forbidden-view" />);
    expect(wrapper.find('#forbidden-view')).toExist();
    expect(wrapper.find('.table__body')).not.toExist();
  });

  it('renders empty list of webhooks', () => {
    const wrapper = mount([]);
    const rows = wrapper.find('.table__body tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows.find('td')).toHaveText('Add a webhook, then manage it in this space.');
  });

  it('renders non-empty list of webhooks', () => {
    const wh1 = { name: 'wh1', url: 'http://test.com', sys: { id: 'wh1' } };
    const wh2 = {
      name: 'wh2',
      url: 'http://google.com',
      transformation: { method: 'PUT' },
      sys: { id: 'wh2' }
    };
    const wrapper = mount([wh1, wh2]);

    const rows = wrapper.find('.table__body tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows.find('td').first()).toHaveText('wh1');

    const urls = rows.find('code');
    expect(urls.at(0)).toHaveText('POST http://test.com');
    expect(urls.at(1)).toHaveText('PUT http://google.com');
  });
});
