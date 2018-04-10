'use strict';

describe('notifications', function () {
  beforeEach(function () {
    module('contentful/test');
    this.notify = this.$inject('notification');
  });

  describe('main bus', function () {
    it('sets error message', function () {
      this.notify.error('MESSAGE');
      expect(this.notify.message.body).toEqual('MESSAGE');
      expect(this.notify.message.severity).toEqual('error');
    });

    it('sets info message', function () {
      this.notify.info('MESSAGE');
      expect(this.notify.message.body).toEqual('MESSAGE');
      expect(this.notify.message.severity).toEqual('info');
    });

    it('clears any message', function () {
      this.notify.info('MESSAGE');
      expect(this.notify.message).not.toBe(null);
      this.notify.clear();
      expect(this.notify.message).toBe(null);
    });
  });

  describe('directive', function () {
    beforeEach(function () {
      this.element = this.$compile('<cf-notifications>');
      this.$apply();
    });

    it('shows a message', function () {
      this.notify.info('MESSAGE');
      this.$apply();
      expect(this.element.text()).toMatch('MESSAGE');
    });

    it('clears a message', function () {
      this.notify.info('MESSAGE');
      this.$apply();
      expect(this.element.text()).toMatch('MESSAGE');
      this.notify.clear();
      this.$apply();
      expect(this.element.text()).not.toMatch('MESSAGE');
    });
  });
});
