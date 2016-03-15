'use strict';

describe('Webhook Call Status directive', function () {

  beforeEach(function () {
    module('contentful/test');

    this.compile = function (code, error) {
      var data = {call: {errors: (error ? [error] : undefined), statusCode: code}};
      this.element = this.$compile('<cf-webhook-call-status call="call" />', data);
    }.bind(this);

    this.testClass = function (expected) {
      expect(this.element.find('.webhook-call__status-indicator').hasClass(expected)).toBe(true);
    }.bind(this);

    this.testContent = function (index, expected) {
      expect(this.element.find('span:nth-child(' + index + ')').text()).toBe(expected);
    }.bind(this);
  });

  it('shows green light when code < 300', function () {
    this.compile(200);
    this.testClass('x--ok');
  });

  it('shows yellow light when code >= 300 and code < 400', function () {
    this.compile(301);
    this.testClass('x--warn');
  });

  it('shows red light if code >= 400', function () {
    this.compile(500);
    this.testClass('x--fail');
  });

  it('shows red light if has some error', function () {
    this.compile(undefined, 'TimeoutError');
    this.testClass('x--fail');
  });

  it('shows red light if has both invalid code and some error', function () {
    this.compile(400, 'TimeoutError');
    this.testClass('x--fail');
  });

  it('shows a label for errors', function () {
    this.compile(undefined, 'TimeoutError');
    this.testContent(3, 'Timeout');
    expect(this.element.find('span:nth-child(3)').text()).toBe('Timeout');
  });

  it('shows a status code when available', function () {
    this.compile(200);
    this.testContent(2, 'HTTP 200');
  });

  it('shows error placeholder if unknown', function () {
    this.compile(undefined, 'BlahBlahError');
    this.testContent(4, 'Unknown error');
  });
});
