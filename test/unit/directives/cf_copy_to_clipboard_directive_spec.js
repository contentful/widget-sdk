'use strict';

describe('cfCopyToClipboard Directive', () => {
  let stubs;

  beforeEach(function () {
    stubs = {
      userAgent: {
        isSafari: sinon.stub()
      },
      $document: [
        {
          execCommand: sinon.stub()
        }
      ]
    };

    module('contentful/test', $provide => {
      $provide.value('userAgent', stubs.userAgent);
    });

    this.compileDirective = function () {
      this.element = this.$compile('<cf-copy-to-clipboard text="my text" />');
      this.element.appendTo('body');
    };
  });

  afterEach(function () {
    this.element.remove();
  });

  it('shows copy button', function () {
    this.compileDirective();
    expect(this.element.is(':visible')).toBe(true);
  });

  it('hides copy button if User Agent is Safari', function () {
    stubs.userAgent.isSafari.returns(true);
    this.compileDirective();
    expect(this.element.is(':visible')).toBe(false);
  });
});
