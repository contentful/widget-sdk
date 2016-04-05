'use strict';

describe('cfCopyToClipboard Directive', function () {
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

    module('contentful/test', function($provide) {
      $provide.value('userAgent', stubs.userAgent);
      $provide.value('$document', stubs.$document);
    });

    this.$rootScope = this.$inject('$rootScope');

    this.compileDirective = function() {
      this.$compile = this.$inject('$compile');
      this.element = this.$compile('<cf-copy-to-clipboard text="my text" />')
                                  (this.$rootScope.$new());
      this.scope = this.element.scope();
    };

  });

  it('shows copy button', function() {
    this.compileDirective();
    expect(this.scope.showCopy).toBe(true);
  });

  it('hides copy button if User Agent is Safari', function() {
    stubs.userAgent.isSafari.returns(true);
    this.compileDirective();
    expect(this.scope.showCopy).toBe(false);
  });

  it('copies text to clipboard', function() {
    this.compileDirective();
    this.element.find('button').click();
    sinon.assert.calledWith(stubs.$document[0].execCommand, 'copy', false, null);
  });

});
