'use strict';

describe('cfMarkdownEditor', function () {
  var $timeout;
  var scope, textarea, editor, elem;
  var libs = window.cfLibs.markdown;

  beforeEach(function () {
    module('contentful/test');

    $timeout = this.$inject('$timeout');
    var $q = this.$inject('$q');
    var LazyLoader = this.$inject('LazyLoader');
    var scopeProps = { fieldData: { value: 'test' }, field: {} };

    sinon.stub(LazyLoader, 'get', function () {
      return $q.resolve(libs);
    });

    elem = this.$compile('<cf-markdown-editor field-data="fieldData" field="field" />', scopeProps);
    textarea = elem.find('textarea').get(0);
    scope = elem.isolateScope();

    // resolve lazy-load promise:
    scope.$apply();

    // can get CodeMirror instance from DOM node now:
    editor = elem.find('.CodeMirror').get(0).CodeMirror;
  });

  it('Initializes editor with data from scope', function () {
    expect(scope.isInitialized).toBe(true);
    expect(editor.getValue()).toBe('test');
  });

  it('Subscribes to preview notifications', function () {
    expect(scope.firstSyncDone).toBe(false);
    $timeout.flush();
    expect(scope.firstSyncDone).toBe(true);
    var previewKeys = _.intersection(Object.keys(scope.preview), ['info', 'tree', 'value', 'field']);
    var infoKeys = _.intersection(Object.keys(scope.preview.info), ['chars', 'words']);
    expect(previewKeys.length).toBe(4);
    expect(infoKeys.length).toBe(2);
  });

  describe('Widget <-> model synchronization', function () {
    beforeEach(function () { sinon.spy(editor, 'setValue'); });
    afterEach(function ()  { editor.setValue.restore();     });

    it('Updates scope with changes made in editor UI', function () {
      editor.setCursor({line: 0, ch: 0});
      editor.replaceSelection('inserted string for ');
      expect(scope.fieldData.value).toBe('inserted string for test');
    });

    it('Does not set content on editor if change originates from widget', function () {
      editor.replaceSelection('AAA');
      scope.$apply();
      sinon.assert.notCalled(editor.setValue);
    });

    it('Does set editor content if model is changed', function () {
      scope.fieldData.value = 'AAA';
      scope.$apply();
      sinon.assert.calledOnce(editor.setValue);
      expect(editor.getValue()).toBe('AAA');
    });
  });

  describe('Handling OT problems', function () {
    it('Goes to preview in case of connection problems', function () {
      expect(scope.inMode('md')).toBe(true);
      scope.isDisabled = true;
      scope.$apply();
      expect(scope.inMode('preview')).toBe(true);
    });

    it('Closes zen mode', function () {
      scope.zen = true;
      scope.isDisabled = true;
      scope.$apply();
      expect(scope.zen).toBe(false);
    });

    it('Marks as non-editable', function () {
      expect(scope.canEdit()).toBe(true);
      scope.isDisabled = true;
      scope.$apply();
      expect(scope.canEdit()).toBe(false);
    });

    it('Disallows to go to MD mode', function () {
      scope.isDisabled = true;
      scope.$apply();
      expect(scope.inMode('preview')).toBe(true);
      scope.setMode('md');
      expect(scope.inMode('preview')).toBe(true);
    });
  });

  describe('Zen Mode API', function () {
    var editorMock;
    beforeEach(function () {
      editorMock = {
        setContent: sinon.stub(),
        getContent: sinon.stub().returns('ZEN CONTENT')
      };
      scope.zenApi.registerChild(editorMock);
    });

    it('Allows to register child editor and populates content', function () {
      scope.zenApi.registerChild(editorMock);
      sinon.assert.calledWith(editorMock.setContent, 'test');
    });

    it('Allows to sync child content to parent\'s model', function () {
      scope.zenApi.syncToParent();
      sinon.assert.calledOnce(editorMock.getContent);
      // should not set editor's value immediately:
      expect(editor.getValue()).toBe('test');
      // only model changes:
      expect(scope.fieldData.value).toBe('ZEN CONTENT');
    });

    it('Syncs model value to parent editor when leaving Zen Mode', function () {
      scope.zen = true;
      scope.zenApi.syncToParent();
      scope.zenApi.toggle();
      expect(editor.getValue()).toBe('ZEN CONTENT');
    });
  });
});
