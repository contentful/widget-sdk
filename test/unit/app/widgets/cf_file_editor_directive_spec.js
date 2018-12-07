import sinon from 'sinon';

describe('cfFileEditor Directive', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.removeDirectives('cfFileDrop');
      $provide.value('services/Filestack.es6', {
        makeDropPane: sinon.stub(),
        pick: sinon.stub().resolves({ fileName: 'x.jpg' })
      });
    });

    // This is needed to transform the image domain
    const tokenStore = this.$inject('services/TokenStore.es6');
    tokenStore.getDomains = sinon.stub().returns({});

    const cfWidgetApi = this.$inject('mocks/widgetApi').create();
    this.fieldApi = cfWidgetApi.field;
    this.fieldApi.setValue = sinon.stub().resolves();
    this.fieldApi.removeValue = sinon.stub().resolves();

    const editorContext = this.$inject('mocks/entityEditor/Context').create();

    this.el = this.$compile(
      '<cf-file-editor />',
      {
        editorData: { entity: { process: sinon.stub().resolves() } },
        editorContext: editorContext,
        fieldLocale: { access: { editable: true } },
        locale: { internal_code: 'en-US' },
        otDoc: {
          getVersion: sinon.stub().returns(123),
          getValueAt: sinon.stub(),
          setValueAt: sinon.stub()
        }
      },
      { cfWidgetApi }
    );

    this.el.appendTo('body');
    this.scope = this.el.scope();

    this.scope.$apply();

    this.assertProcessesAndValidatesAsset = () => {
      sinon.assert.calledWith(this.scope.editorData.entity.process, 123, 'en-US');
      sinon.assert.called(this.scope.editorContext.validator.run);
    };
  });

  afterEach(function() {
    this.el.remove();
    this.scope.$destroy();
  });

  describe('scope.selectFile()', () => {
    beforeEach(function() {
      this.Filestack = this.$inject('services/Filestack.es6');
      this.scope.selectFile();
      this.$apply();
    });

    it('calls Filestack.pick', function() {
      sinon.assert.called(this.Filestack.pick);
    });

    it('sets the file on the field API', function() {
      sinon.assert.calledOnce(this.fieldApi.setValue);
      sinon.assert.calledWithExactly(this.fieldApi.setValue, { fileName: 'x.jpg' });
    });

    it('sets "scope.file" and validates', function() {
      expect(this.scope.file).toEqual({ fileName: 'x.jpg' });
      sinon.assert.called(this.scope.editorContext.validator.run);
    });

    it('processes and validates asset', function() {
      this.assertProcessesAndValidatesAsset();
    });

    it('sets the document title if it is not yet present', function() {
      sinon.assert.calledWith(this.scope.otDoc.setValueAt, ['fields', 'title', 'en-US'], 'x');
    });

    it('does not set the document title if it present', function() {
      this.scope.otDoc.getValueAt = sinon.stub();
      this.scope.otDoc.getValueAt.withArgs(['fields', 'title', 'en-US']).returns('title');
      this.scope.selectFile();
      this.$apply();
      // called once in the intial run
      sinon.assert.calledOnce(this.scope.otDoc.setValueAt);
    });

    it('runs validations on file upload errors', function() {
      this.Filestack.pick.rejects(new Error());
      this.scope.selectFile();
      this.$apply();
      // 1. set value, 2. catch error
      sinon.assert.calledTwice(this.scope.editorContext.validator.run);
    });

    it('removes value and shows error when asset processing fails', function() {
      const ComponentLibrary = this.$inject('@contentful/forma-36-react-components');
      ComponentLibrary.Notification.error = sinon.stub();
      this.scope.editorData.entity.process = sinon.stub().rejects();
      this.scope.selectFile();
      this.$apply();
      // both called once in the second run
      sinon.assert.calledOnce(this.fieldApi.removeValue);
      sinon.assert.calledOnce(ComponentLibrary.Notification.error);
    });
  });

  describe('scope.deleteFile()', () => {
    beforeEach(function() {
      this.fieldApi.removeValue = sinon.stub().resolves();
      this.scope.deleteFile();
      this.$apply();
    });

    it('removes the value from the field API', function() {
      sinon.assert.calledOnce(this.fieldApi.removeValue);
    });

    it('sets "scope.file" to "null"', function() {
      expect(this.scope.file).toBe(null);
    });

    it('it does not process asset', function() {
      sinon.assert.notCalled(this.scope.editorData.entity.process);
    });
  });

  it('shows spinner when image is loading', function() {
    this.fieldApi.onValueChanged.yield({
      url: '//images.contentful.com',
      contentType: 'image/png'
    });

    this.$apply();
    const loader = this.el.find('.file-progress:first');
    expect(loader.is(':visible')).toBe(true);

    this.el.find('img').trigger('load');
    this.$apply();
    expect(loader.is(':visible')).toBe(false);
  });

  it('processes unprocessed asset', function() {
    this.fieldApi.onValueChanged.yield({
      upload: '//images.contentful.com'
    });
    this.assertProcessesAndValidatesAsset();
  });
});
