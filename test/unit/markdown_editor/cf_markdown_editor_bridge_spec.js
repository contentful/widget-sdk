'use strict';

describe('cfMarkdownEditorBridge', function () {
  var scope, textarea;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otBindModel');
      $provide.removeDirectives('cfMarkdownEditor');
    });

    var resolved = this.$inject('$q').when();
    var scopeProps = {
      otEditable: true,
      fieldData: { value: null },
      otChangeValue: sinon.stub().returns(resolved)
    };

    var elem = this.$compile('<cf-markdown-editor-bridge />', scopeProps);
    scope = elem.scope();
    textarea = elem.find('.markdown-transfer-textarea').get(0);
  });

  it('Dispatches paste event on model change', function () {
    var pasteSpy = sinon.stub();
    textarea.addEventListener('paste', pasteSpy, false);
    scope.fieldData.value = 'test';
    scope.$apply();
    sinon.assert.calledOnce(pasteSpy);
    scope.fieldData.value = 'test2';
    scope.$apply();
    sinon.assert.calledTwice(pasteSpy);
  });
});
