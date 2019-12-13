import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup } from '@testing-library/react';
import WebhookHealth from './WebhookHealth';

const mockWebhookRepo = {
  logs: {
    getCall: jest.fn().mockResolvedValue({}),
    getHealth: jest.fn().mockResolvedValue({
      calls: {
        health: 50,
        total: 100
      }
    })
  }
};

jest.mock('app/settings/webhooks/services/WebhookRepoInstance', () => ({
  getWebhookRepo: () => mockWebhookRepo
}));

describe('WebhookHealth', () => {
  afterEach(() => {
    cleanup();
    jest.resetAllMocks();
  });

  const stubAndMount = (calls = {}) => {
    mockWebhookRepo.logs.getHealth.mockResolvedValue({ calls });
    return [render(<WebhookHealth webhookId="whid" />)];
  };

  it('starts in the loading state', () => {
    const [{ container }] = stubAndMount();
    expect(container).toHaveTextContent('Loading…');
  });

  it('fetches health status when mounted', () => {
    stubAndMount();
    expect(mockWebhookRepo.logs.getHealth).toHaveBeenCalledTimes(1);
    expect(mockWebhookRepo.logs.getHealth).toHaveBeenCalledWith('whid');
  });

  it('displays "no data..." when fetching failed', async () => {
    expect.assertions(2);
    const ERROR = new Error('failed to fetch');

    mockWebhookRepo.logs.getHealth.mockRejectedValue(ERROR);

    const { container } = render(<WebhookHealth webhookId="whid" />);

    try {
      await mockWebhookRepo.logs.getHealth();
    } catch (err) {
      expect(err).toBe(ERROR);
    }

    expect(container).toHaveTextContent('No data collected yet');
  });

  it('calculates percentage when fetched', async () => {
    expect.assertions(1);
    const [{ getByTestId }] = stubAndMount({ total: 2, healthy: 1 });
    await mockWebhookRepo.logs.getHealth();

    expect(getByTestId('health-percentage')).toHaveTextContent('50%');
  });

  const testStatus = async (calls, expected) => {
    expect.assertions(1);
    const [{ getByTestId }] = stubAndMount(calls);
    await mockWebhookRepo.logs.getHealth();

    expect(getByTestId('health-status-indicator')).toHaveAttribute('data-status', expected);
  };

  it('shows red light', testStatus.bind(null, { total: 2, healthy: 1 }, 'failure'));
  it('shows yellow light', testStatus.bind(null, { total: 4, healthy: 3 }, 'warning'));
  it('shows green light', testStatus.bind(null, { total: 2, healthy: 2 }, 'success'));
});
