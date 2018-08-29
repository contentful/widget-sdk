describe('cfMarkdownEditor', () => {
  beforeEach(function() {
    this.analytics = { track: sinon.spy() };
    module('contentful/test', $provide => {
      $provide.value('TheLocaleStore', {
        getDefaultLocale: () => ({ code: 'some random locale' }),
        getLocales: () => [{ code: 'en-US' }]
      });
      $provide.value('analytics/Analytics', this.analytics);
    });

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.widgetApi.fieldProperties.value$.set('test');
    this.fieldStubs = this.widgetApi.field;

    const elem = this.$compile(
      '<cf-markdown-editor />',
      {},
      {
        cfWidgetApi: { field: this.fieldStubs }
      }
    );

    this.scope = elem.isolateScope();

    // resolve lazy-load promise:
    this.scope.$apply();

    // can get CodeMirror instance from DOM node now:
    this.editor = elem.find('.CodeMirror').get(0).CodeMirror;
  });

  it('Marks editor as ready when MD vendors are loaded', function() {
    expect(this.scope.isReady).toBe(true);
  });

  it('Initializes editor with data from the field', function() {
    expect(this.editor.getValue()).toBe('test');
  });

  it('Subscribes to preview notifications', function() {
    this.$inject('$timeout').flush();
    const previewKeys = _.intersection(Object.keys(this.scope.preview), [
      'info',
      'tree',
      'value',
      'field'
    ]);
    const infoKeys = _.intersection(Object.keys(this.scope.preview.info), ['chars', 'words']);
    expect(previewKeys.length).toBe(4);
    expect(infoKeys.length).toBe(2);
  });

  describe('Widget <-> field synchronization', () => {
    beforeEach(function() {
      sinon.spy(this.editor, 'setValue');
    });

    it('Updates field with changes made in editor UI', function() {
      this.editor.setCursor({ line: 0, ch: 0 });
      this.editor.replaceSelection('inserted string for ');
      sinon.assert.calledOnce(this.fieldStubs.setValue.withArgs('inserted string for test'));
    });

    it('Does not set content on editor if change originates from widget', function() {
      this.editor.replaceSelection('AAA');
      sinon.assert.notCalled(this.editor.setValue.withArgs('AAA'));
    });

    it('Does set editor content if field value is changed', function() {
      this.widgetApi.fieldProperties.value$.set('AAA');
      sinon.assert.calledOnce(this.editor.setValue.withArgs('AAA'));
      expect(this.editor.getValue()).toBe('AAA');
    });
  });

  describe('Handling OT problems', () => {
    it('Goes to preview in case of connection problems', function() {
      expect(this.scope.inMode('md')).toBe(true);
      this.widgetApi.fieldProperties.isDisabled$.set(true);
      expect(this.scope.inMode('preview')).toBe(true);
    });

    it('Closes zen mode', function() {
      this.scope.zenApi.toggle();
      this.widgetApi.fieldProperties.isDisabled$.set(true);
      expect(this.scope.zen).toBe(false);
    });

    it('Marks as non-editable', function() {
      expect(this.scope.canEdit()).toBe(true);
      this.widgetApi.fieldProperties.isDisabled$.set(true);
      expect(this.scope.canEdit()).toBe(false);
    });

    it('Disallows to go to MD mode', function() {
      this.widgetApi.fieldProperties.isDisabled$.set(true);
      expect(this.scope.inMode('preview')).toBe(true);
      this.scope.setMode('md');
      expect(this.scope.inMode('preview')).toBe(true);
    });
  });

  describe('Zen Mode API', () => {
    beforeEach(function() {
      this.editorMock = { setContent: sinon.stub() };
      this.scope.zenApi.registerChild(this.editorMock);
    });

    it('sets zen mode as inactive by default', function() {
      expect(this.scope.zen).toBe(false);
    });

    it('enters zen mode', function() {
      this.scope.zenApi.toggle();
      expect(this.scope.zen).toBe(true);
    });

    it('exits zen mode', function() {
      this.scope.zenApi.toggle();
      this.scope.zenApi.toggle();
      expect(this.scope.zen).toBe(false);
    });

    it('Allows to register child editor and populates content', function() {
      this.scope.zenApi.registerChild(this.editorMock);
      sinon.assert.calledWith(this.editorMock.setContent, 'test');
    });

    it('#syncToParent calls field.setValue()', function() {
      this.fieldStubs.setValue.reset();
      this.scope.zenApi.syncToParent('ZEN CONTENT');
      sinon.assert.called(this.fieldStubs.setValue.withArgs('ZEN CONTENT'));
    });

    it('Syncs field value to parent editor when leaving Zen Mode', function() {
      sinon.spy(this.editor, 'setValue');
      this.scope.zenApi.toggle();
      this.scope.zenApi.syncToParent('ZEN CONTENT');
      // wire field set value with getter:
      this.scope.zenApi.toggle();
      sinon.assert.calledOnce(this.editor.setValue.withArgs('ZEN CONTENT'));
    });

    it('tracks toggling zen mode on', function() {
      this.scope.zenApi.toggle();
      sinon.assert.calledOnceWith(this.analytics.track, 'markdown_editor:action', {
        action: 'toggleFullscreenMode',
        new_value: true,
        fullscreen: false
      });
    });

    it('tracks toggling zen mode off', function() {
      this.scope.zenApi.toggle();
      this.analytics.track.reset();
      this.scope.zenApi.toggle();
      sinon.assert.calledOnceWith(this.analytics.track, 'markdown_editor:action', {
        action: 'toggleFullscreenMode',
        new_value: false,
        fullscreen: true
      });
    });
  });
});
