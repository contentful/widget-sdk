'use strict';

describe('Webhook Health directive', function () {

  beforeEach(function () {
    module('contentful/test');

    this.getStub = sinon.stub().resolves({calls: {}});
    this.endpointStub = sinon.stub().returns({get: this.getStub});

    this.$inject('spaceContext').space = {endpoint: this.endpointStub};

    this.compile = function (webhookId) {
      var data = {webhook: {id: 'whid' || webhookId}};
      this.element = this.$compile('<cf-webhook-health webhook-id="webhook.id" />', data);
    }.bind(this);

    this.testClass = function (expected) {
      this.compile();
      expect(this.element.find('.webhook-call__status-indicator').hasClass(expected)).toBe(true);
    }.bind(this);
  });

  it('fetches health status when mounted', function () {
    this.compile();
    sinon.assert.calledOnce(this.endpointStub.withArgs('webhooks/whid/health'));
    sinon.assert.calledOnce(this.getStub);
  });

  it('calculates percentage', function () {
    this.getStub.resolves({calls: {total: 2, healthy: 1}});
    this.compile();
    expect(this.element.find('span:last-child').text()).toBe('50%');
  });

  it('shows red light', function () {
    this.getStub.resolves({calls: {total: 2, healthy: 1}});
    this.testClass('x--fail');
  });

  it('shows yellow light', function () {
    this.getStub.resolves({calls: {total: 4, healthy: 3}});
    this.testClass('x--warn');
  });

  it('shows green light', function () {
    this.getStub.resolves({calls: {total: 2, healthy: 2}});
    this.testClass('x--ok');
  });
});
