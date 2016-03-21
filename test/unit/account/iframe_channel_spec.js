'use strict';

describe('Iframe channel', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$window = this.$inject('$window');
    this.sourceIframe = {};
    this.iframe = [{contentWindow: this.sourceIframe}];
    this.channel = this.$inject('iframeChannel').create(this.iframe);

    this.e = function (data, src) {
      return _.extend(new Event('message'), {source: src || this.sourceIframe, data: data || {}});
    };
  });

  it('creates channel', function () {
    expect(_.isFunction(this.channel.onMessage)).toBe(true);
    expect(_.isFunction(this.channel.off)).toBe(true);
  });

  it('dispatches message received via iframe postMessage', function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.channel.onMessage(spy1);
    this.channel.onMessage(spy2);
    this.$window.dispatchEvent(this.e({some: 'data'}));
    this.$apply();
    sinon.assert.calledOnce(spy1.withArgs({some: 'data'}));
    sinon.assert.calledOnce(spy2.withArgs({some: 'data'}));
  });

  it('does not dispatches message if received from a strange iframe', function () {
    var spy = sinon.spy();
    this.channel.onMessage(spy);
    this.$window.dispatchEvent(this.e(null, '?'));
    this.$apply();
    sinon.assert.notCalled(spy);
  });

  it('turns off all listeners when requested', function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.channel.onMessage(spy1);
    this.channel.onMessage(spy2);
    this.channel.off();
    this.$window.dispatchEvent(this.e());
    this.$apply();
    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  });
});
