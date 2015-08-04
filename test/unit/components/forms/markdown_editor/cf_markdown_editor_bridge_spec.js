'use strict';

describe('cfMarkdownEditorBridge', function () {
  var scope, textarea;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otBindModel');
    });

    inject(function ($rootScope, $compile, $q) {
      scope = $rootScope;
      scope.otEditable = true;
      scope.fieldData = {value: null};
      scope.otChangeValue = sinon.stub().returns($q.when());
      var elem = $compile('<div cf-markdown-editor-bridge></div>')(scope);
      textarea = elem.find('.markdown-transfer-textarea').get(0);
    });
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
