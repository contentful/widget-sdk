'use strict';

describe('cfMarkdownEditorBridge', function () {
  var scope, textarea;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otBindText');
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
    textarea = elem.find('.markdown-transfer-textarea');
  });

  it('Dispatches input and paste events on model change', function () {
    var inputSpy = sinon.stub();
    var pasteSpy = sinon.stub();
    textarea.on('input', inputSpy);
    textarea.on('paste', pasteSpy);
    scope.editorFieldData.value = 'test';
    scope.$apply();
    sinon.assert.calledOnce(inputSpy);
    sinon.assert.calledOnce(pasteSpy);
    scope.editorFieldData.value = 'test2';
    scope.$apply();
    sinon.assert.calledTwice(inputSpy);
    sinon.assert.calledTwice(pasteSpy);
  });

  it('Clears text when fieldData is set to undefined', function () {
    var inputSpy = sinon.stub();
    textarea.on('input', inputSpy);
    scope.fieldData.value = 'test';
    scope.$apply();
    expect(textarea.val()).toBe('test');
    sinon.assert.calledOnce(inputSpy);
    scope.fieldData.value = undefined;
    scope.$apply();
    expect(textarea.val()).toBe('');
    sinon.assert.calledTwice(inputSpy);
  });
});
