'use strict';

describe('notifications', () => {
  beforeEach(function() {
    this.clearTimeoutMs = 100;
    this.transformTimeoutMs = 200;
    module('contentful/test', $provide => {
      $provide.constant('notification/CLEAR_TIMEOUT_MS', this.clearTimeoutMs);
      $provide.constant('notification/TRANSFORM_TIMEOUT_MS', this.transformTimeoutMs);
    });

    this.notify = this.$inject('notification');

    this.sandbox = sinon.sandbox.create();
    this.clock = this.sandbox.useFakeTimers();

    this.sandbox.spy(this.notify, 'clear');
    this.sandbox.spy(this.notify, 'markAsSeen');
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('main bus', () => {
    it('sets error message', function() {
      this.notify.error('MESSAGE');
      expect(this.notify.message.body).toEqual('MESSAGE');
      expect(this.notify.message.severity).toEqual('error');
    });

    it('sets info message', function() {
      this.notify.info('MESSAGE');
      expect(this.notify.message.body).toEqual('MESSAGE');
      expect(this.notify.message.severity).toEqual('info');
    });

    it('clears any message', function() {
      this.notify.info('MESSAGE');
      expect(this.notify.message).not.toBe(null);
      this.notify.clear();
      expect(this.notify.message).toBe(null);
    });

    it('marks messages seen by default after a delay has elapsed', function() {
      this.notify.info('MESSAGE');

      this.clock.tick(this.clearTimeoutMs - 1);
      sinon.assert.notCalled(this.notify.markAsSeen);
      this.clock.tick(1);
      sinon.assert.calledOnce(this.notify.markAsSeen);

      this.clock.tick(this.transformTimeoutMs);
      sinon.assert.notCalled(this.notify.clear);
      this.$flush();
      sinon.assert.notCalled(this.notify.clear);
      this.clock.tick(this.transformTimeoutMs - 1);
      sinon.assert.notCalled(this.notify.clear);
      this.clock.tick(1);
      sinon.assert.calledOnce(this.notify.clear);
    });

    it('does not automatically mark as seen after the delay', function() {
      this.notify.info('MESSAGE');
      this.notify.markAsSeen();
      this.clock.tick(this.clearTimeoutMs);
      sinon.assert.calledOnce(this.notify.markAsSeen);
    });
  });

  describe('directive', () => {
    beforeEach(function() {
      this.element = this.$compile('<cf-notifications>');
      this.$apply();
    });

    it('shows a message', function() {
      this.notify.info('MESSAGE');
      this.$apply();
      expect(this.element.text()).toMatch('MESSAGE');
    });

    it('clears a message', function() {
      this.notify.info('MESSAGE');
      this.$apply();
      expect(this.element.text()).toMatch('MESSAGE');
      this.notify.clear();
      this.$apply();
      expect(this.element.text()).not.toMatch('MESSAGE');
    });
  });
});
