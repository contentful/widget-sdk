'use strict';

describe('cfMarkdownEditor', function () {
  var $timeout;
  var scope, textarea, editor;

  beforeEach(function () {
    module('contentful/test');

    inject(function ($rootScope, $compile, $injector) {
      $timeout = $injector.get('$timeout');
      var compiled = $compile('<div cf-markdown-editor field-data="fieldData"></div>');
      var elem = compiled(_.extend($rootScope.$new(), { fieldData: { value: 'test' } }));
      textarea = elem.find('textarea').get(0);
      scope = elem.isolateScope();

      // resolves editor's lazy-load promise, subscribes for changes:
      scope.$apply();
      // can get CodeMirror instance from DOM node now:
      editor = elem.find('.CodeMirror').get(0).CodeMirror;
    });
  });

  it('Initializes editor with data from scope', function () {
    expect(scope.isInitialized).toBe(true);
    expect(editor.getValue()).toBe('test');
  });

  it('Subscribes to editor changes', function () {
    expect(scope.firstSyncDone).toBe(false);
    $timeout.flush();
    expect(scope.firstSyncDone).toBe(true);
    var infoKeys = _.intersection(Object.keys(scope.info), ['chars', 'words', 'time']);
    expect(infoKeys.length).toBe(3);
  });

  it('Updates scope with changes made in editor UI', function () {
    editor.setCursor({ line: 0, ch: 0 });
    editor.replaceSelection('inserted string for ');
    $timeout.flush();
    expect(scope.fieldData.value).toBe('inserted string for test');
  });
});
