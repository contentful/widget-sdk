import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup } from 'react-testing-library';
import * as spaceContextMocked from 'ng/spaceContext';
import WebhookHealth from './WebhookHealth.es6';

describe('WebhookHealth', () => {
  beforeEach(() => {
    spaceContextMocked.webhookRepo.logs.getHealth.mockReset();
  });

  afterEach(cleanup);

  const stubAndMount = (calls = {}) => {
    const getStub = jest.fn().mockResolvedValue({ calls });
    spaceContextMocked.webhookRepo.logs.getHealth = getStub;
    return [render(<WebhookHealth webhookId="whid" />), getStub];
  };

  it('starts in the loading state', () => {
    const [{ container }] = stubAndMount();
    expect(container).toHaveTextContent('Loading…');
  });

  it('fetches health status when mounted', () => {
    const [_, getStub] = stubAndMount();
    expect(getStub).toHaveBeenCalledTimes(1);
    expect(getStub).toHaveBeenCalledWith('whid');
  });

  it('displays "no data..." when fetching failed', async () => {
    expect.assertions(2);
    const ERROR = new Error('failed to fetch');
    const getStub = jest.fn().mockRejectedValue(ERROR);
    spaceContextMocked.webhookRepo.logs.getHealth = getStub;
    const { container } = render(<WebhookHealth webhookId="whid" />);

    try {
      await getStub();
    } catch (err) {
      expect(err).toBe(ERROR);
    }

    expect(container).toHaveTextContent('No data collected yet');
  });

  it('calculates percentage when fetched', async () => {
    expect.assertions(1);
    const [{ getByTestId }, getStub] = stubAndMount({ total: 2, healthy: 1 });
    await getStub();

    expect(getByTestId('health-percentage')).toHaveTextContent('50%');
  });

  const testStatus = async (calls, expected) => {
    expect.assertions(1);
    const [{ getByTestId }, getStub] = stubAndMount(calls);
    await getStub();

    expect(getByTestId('health-status-indicator')).toHaveAttribute('data-status', expected);
  };

  it('shows red light', testStatus.bind(null, { total: 2, healthy: 1 }, 'failure'));
  it('shows yellow light', testStatus.bind(null, { total: 4, healthy: 3 }, 'warning'));
  it('shows green light', testStatus.bind(null, { total: 2, healthy: 2 }, 'success'));
});
