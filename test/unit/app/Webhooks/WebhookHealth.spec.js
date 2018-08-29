import React from 'react';
import Enzyme from 'enzyme';
import WebhookHealth from 'app/Webhooks/WebhookHealth';

describe('WebhookHealth', function() {
  const mount = getStub => {
    const repo = { logs: { getHealth: getStub } };
    return Enzyme.mount(<WebhookHealth webhookId="whid" webhookRepo={repo} />);
  };

  const stubAndMount = (calls = {}) => {
    const getStub = sinon.stub().resolves({ calls });
    return [mount(getStub), getStub];
  };

  it('starts in the loading state', function() {
    const [wrapper] = stubAndMount();
    expect(wrapper.find('span').text()).toBe('Loading…');
  });

  it('fetches health status when mounted', function() {
    const [_, getStub] = stubAndMount();
    sinon.assert.calledOnce(getStub.withArgs('whid'));
  });

  it('displays "no data..." when fetching failed', async function() {
    const ERROR = new Error('failed to fetch');
    const getStub = sinon.stub().rejects(ERROR);
    const wrapper = mount(getStub);

    try {
      await getStub();
    } catch (err) {
      expect(err).toBe(ERROR);
    }

    wrapper.update();
    expect(wrapper.find('span').text()).toBe('No data collected yet');
  });

  it('calculates percentage when fetched', async function() {
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
    const [wrapper, getStub] = stubAndMount(calls);
    await getStub();
    wrapper.update();
    expect(wrapper.find('.webhook-call__status-indicator').prop('data-status')).toBe(expected);
  };

  it('shows red light', testStatus.bind(null, { total: 2, healthy: 1 }, 'failure'));
  it('shows yellow light', testStatus.bind(null, { total: 4, healthy: 3 }, 'warning'));
  it('shows green light', testStatus.bind(null, { total: 2, healthy: 2 }, 'success'));
});
