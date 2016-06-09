'use strict';

describe('cfInlineCopy directive', function () {
  var stubs;

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

    module('contentful/test', function ($provide) {
      $provide.value('userAgent', stubs.userAgent);
      $provide.value('$document', stubs.$document);
    });

    this.compile = function () {
      this.element = this.$compile('<cf-inline-copy text="abc" />', { context: {} });
      this.scope = this.element.scope();
    };
  });

  afterEach(function () {
    stubs = null;
  });

  it('shows copy link', function () {
    this.compile();
    expect(this.scope.showCopy).toBe(true);
  });

  it('hides copy link on Safari', function () {
    stubs.userAgent.isSafari.returns('Safari');
    this.compile();
    expect(this.scope.showCopy).toBe(false);
  });

  it('copies data to clipboard', function () {
    stubs.$document[0].execCommand.returns();
    this.compile();
    this.element.find('a').trigger('click');
    sinon.assert.calledOnce(stubs.$document[0].execCommand);
  });
});
