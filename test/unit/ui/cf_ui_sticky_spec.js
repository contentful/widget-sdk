'use strict';

describe('cfUiSticky directive', function () {
  beforeEach(function () {
    module('cf.ui');
    const markup = '<div class="workbench-main">' +
                    '<div id="container">' +
                    '<nav cf-ui-sticky>Nav</nav>' +
                    '<p>Some long content</p>' +
                    '</div></div>';
    this.$workbench = this.$compile(markup);
    this.$nav = this.$workbench.find('nav');
    this.$container = this.$workbench.find('#container');
  });

  it('applies .fixed class when page is scrolled to the bottom', function () {
    this.$container[0].getBoundingClientRect = sinon.stub().returns({top: -50});
    this.$workbench.triggerHandler('scroll');
    expect(this.$nav.hasClass('fixed')).toBe(true);

  });

  it('does not apply .fixed class when element is in viewport', function () {
    this.$container[0].getBoundingClientRect = sinon.stub().returns({top: 100});
    this.$workbench.triggerHandler('scroll');
    expect(this.$nav.hasClass('fixed')).toBe(false);
  });
});
