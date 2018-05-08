'use strict';

describe('Webhook Health directive', function () {
  beforeEach(function () {
    module('contentful/test');

    this.getStub = sinon.stub().resolves({calls: {}});
    this.$inject('WebhookRepository').getInstance = _.constant({logs: {getHealth: this.getStub}});

    this.compile = function (webhookId) {
      const data = {webhook: {id: 'whid' || webhookId}};
      this.element = this.$compile('<cf-webhook-health webhook-id="webhook.id" />', data);
    }.bind(this);

    this.testStatus = function (expected) {
      this.compile();
      expect(this.element.find('.webhook-call__status-indicator').attr('data-status')).toBe(expected);
    }.bind(this);
  });

  it('fetches health status when mounted', function () {
    this.compile();
    sinon.assert.calledOnce(this.getStub.withArgs('whid'));
  });

  it('calculates percentage', function () {
    this.getStub.resolves({calls: {total: 2, healthy: 1}});
    this.compile();
    expect(this.element.find('span:last-child').text()).toBe('50%');
  });

  it('shows red light', function () {
    this.getStub.resolves({calls: {total: 2, healthy: 1}});
    this.testStatus('failure');
  });

  it('shows yellow light', function () {
    this.getStub.resolves({calls: {total: 4, healthy: 3}});
    this.testStatus('warning');
  });

  it('shows green light', function () {
    this.getStub.resolves({calls: {total: 2, healthy: 2}});
    this.testStatus('success');
  });
});
