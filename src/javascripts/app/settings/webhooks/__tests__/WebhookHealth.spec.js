import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import spaceContext from 'spaceContext';
import WebhookHealth from '../WebhookHealth.es6';

describe('WebhookHealth', () => {
  beforeEach(() => {
    spaceContext.webhookRepo.logs.getHealth.reset;
  });

  const stubAndMount = (calls = {}) => {
    const getStub = sinon.stub().resolves({ calls });
    spaceContext.webhookRepo.logs.getHealth = getStub;
    return [Enzyme.mount(<WebhookHealth webhookId="whid" />), getStub];
  };

  it('starts in the loading state', () => {
    const [wrapper] = stubAndMount();
    expect(wrapper.find('span').text()).toBe('Loading…');
  });

  it('fetches health status when mounted', () => {
    const [_, getStub] = stubAndMount();
    expect(getStub.calledWith('whid')).toBe(true);
    expect(getStub.calledOnce).toBe(true);
  });

  it('displays "no data..." when fetching failed', async () => {
    expect.assertions(2);
    const ERROR = new Error('failed to fetch');
    const getStub = sinon.stub().rejects(ERROR);
    spaceContext.webhookRepo.logs.getHealth = getStub;
    const wrapper = Enzyme.mount(<WebhookHealth webhookId="whid" />);

    try {
      await getStub();
    } catch (err) {
      expect(err).toBe(ERROR);
    }

    wrapper.update();
    expect(wrapper.find('span').text()).toBe('No data collected yet');
  });

  it('calculates percentage when fetched', async () => {
    expect.assertions(1);
    const [wrapper, getStub] = stubAndMount({ total: 2, healthy: 1 });
    await getStub();
    wrapper.update();
    expect(
      wrapper
        .find('span')
        .at(1)
        .text()
    ).toBe('50%');
  });

  const testStatus = async (calls, expected) => {
    expect.assertions(1);
    const [wrapper, getStub] = stubAndMount(calls);
    await getStub();
    wrapper.update();
    expect(wrapper.find('.webhook-call__status-indicator').prop('data-status')).toBe(expected);
  };

  it('shows red light', testStatus.bind(null, { total: 2, healthy: 1 }, 'failure'));
  it('shows yellow light', testStatus.bind(null, { total: 4, healthy: 3 }, 'warning'));
  it('shows green light', testStatus.bind(null, { total: 2, healthy: 2 }, 'success'));
});
