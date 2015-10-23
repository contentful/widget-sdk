'use strict';

describe('cfWidgetRenderer Directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.widget = {};
    this.compile = function () {
      return this.$compile('<cf-widget-renderer>', {widget: this.widget});
    };
  });

  it('renders a widget template', function() {
    this.widget.template = '<p class=foo>';
    var el = this.compile();
    expect(el.find('.foo').length).toBe(1);
  });

  it('exchanges a rendered widget template', function() {
    this.widget.template = '<p class=foo>';
    var el = this.compile();
    expect(el.find('.foo').length).toBe(1);

    this.widget.template = '<p class=bar>';
    this.$apply();

    expect(el.find('.foo').length).toBe(0);
    expect(el.find('.bar').length).toBe(1);
  });

});
