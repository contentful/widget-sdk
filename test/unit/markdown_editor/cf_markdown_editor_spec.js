'use strict';

describe('cfMarkdownEditor', function () {
  var $timeout;
  var scope, textarea, editor;
  var libs = window.cfLibs.markdown;

  beforeEach(function () {
    module('contentful/test');

    $timeout = this.$inject('$timeout');
    var $q = this.$inject('$q');
    var MarkdownEditor = this.$inject('MarkdownEditor');
    var scopeProps = { fieldData: { value: 'test' }, field: {} };

    sinon.stub(MarkdownEditor, 'create', function (textarea) {
      return $q.when(MarkdownEditor.createManually(textarea, {}, libs.CodeMirror, libs.marked));
    });

    var elem = this.$compile('<cf-markdown-editor field-data="fieldData" field="field" />', scopeProps);
    textarea = elem.find('textarea').get(0);
    scope = elem.isolateScope();

    // resolves editor's lazy-load promise, subscribes for changes:
    scope.$apply();
    // can get CodeMirror instance from DOM node now:
    editor = elem.find('.CodeMirror').get(0).CodeMirror;
  });

  it('Initializes editor with data from scope', function () {
    expect(scope.isInitialized).toBe(true);
    expect(editor.getValue()).toBe('test');
  });

  it('Subscribes to editor changes', function () {
    expect(scope.firstSyncDone).toBe(true);
    var infoKeys = _.intersection(Object.keys(scope.info), ['chars', 'words']);
    expect(infoKeys.length).toBe(2);
  });

  it('Updates scope with changes made in editor UI', function () {
    editor.setCursor({ line: 0, ch: 0 });
    editor.replaceSelection('inserted string for ');
    $timeout.flush();
    expect(scope.fieldData.value).toBe('inserted string for test');
  });
});
