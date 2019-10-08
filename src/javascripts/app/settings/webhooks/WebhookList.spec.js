import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup } from '@testing-library/react';
import WebhookList from './WebhookList.es6';

const mockWebhookRepo = {
  logs: {
    getHealth: jest.fn().mockResolvedValue({
      calls: {
        healthy: 50,
        total: 100
      }
    })
  }
};

jest.mock(
  'app/settings/webhooks/services/WebhookRepoInstance',
  () => ({
    getWebhookRepo: () => mockWebhookRepo
  }),
  { virtual: true }
);

describe('WebhookList', () => {
  afterEach(cleanup);

  const renderComponent = webhooks => {
    return render(
      <WebhookList webhooks={webhooks} hasAwsProxy={false} openTemplateDialog={() => {}} />
    );
  };

  it('renders empty list of webhooks', () => {
    const { getByTestId } = renderComponent([]);
    expect(getByTestId('empty-webhook-row')).toHaveTextContent(
      'Add a webhook, then manage it in this space.'
    );
  });

  it('renders non-empty list of webhooks', () => {
    const wh1 = { name: 'wh1', url: 'http://test.com', sys: { id: 'wh1' } };
    const wh2 = {
      name: 'wh2',
      url: 'http://google.com',
      transformation: { method: 'PUT' },
      sys: { id: 'wh2' }
    };
    const { getAllByTestId } = renderComponent([wh1, wh2]);

    const rows = getAllByTestId('webhook-row');
    expect(rows).toHaveLength(2);

    expect(getAllByTestId('webhook-name')[0]).toHaveTextContent('wh1');
    expect(getAllByTestId('webhook-name')[1]).toHaveTextContent('wh2');

    expect(getAllByTestId('webhook-code')[0]).toHaveTextContent('POST http://test.com');
    expect(getAllByTestId('webhook-code')[1]).toHaveTextContent('PUT http://google.com');
  });
});
