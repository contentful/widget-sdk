'use strict';

describe('cfFileEditor Directive', function () {
  let scope, fieldApi;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('cfFileDrop');
      $provide.value('filepicker', {
        pick: sinon.stub(),
        parseFPFile: sinon.stub()
      });
    });

    // This is needed to transform the image domain
    const tokenStore = this.$inject('services/TokenStore');
    tokenStore.getDomains = sinon.stub().returns({});

    const widgetApi = this.$inject('mocks/widgetApi').create();
    fieldApi = widgetApi.field;

    const editorContext = this.$inject('mocks/entityEditor/Context').create();

    this.el = this.$compile('<cf-file-editor />', {
      editorContext: editorContext,
      fieldLocale: {access: {editable: true}},
      fieldData: {
        fileName: 'file.jpg',
        fileType: 'image/jpeg'
      }
    }, {
      cfWidgetApi: widgetApi
    });
    this.el.appendTo('body');
    scope = this.el.scope();

    scope.$apply();
  });

  afterEach(function () {
    this.el.remove();
    scope.$destroy();
    scope = fieldApi = null;
  });

  it('toggles meta info', function () {
    scope.toggleMeta();
    expect(scope.showMeta).toBeTruthy();
  });

  describe('scope.uploadFile()', function () {
    beforeEach(function () {
      fieldApi.setValue = sinon.stub().resolves();

      const FP = this.$inject('filepicker');
      FP.pick.resolves('FP FILE');
      FP.parseFPFile.returns('FILE DATA');

      scope.$emit = sinon.stub();

      scope.uploadFile();
      this.$apply();
    });

    it('calls filepickers pick', function () {
      const FP = this.$inject('filepicker');
      sinon.assert.called(FP.pick);
    });

    it('sets the file on the field API', function () {
      sinon.assert.calledOnce(fieldApi.setValue);
      sinon.assert.calledWithExactly(fieldApi.setValue, 'FILE DATA');
    });

    it('sets "scope.file"', function () {
      expect(scope.file).toEqual('FILE DATA');
    });

    it('emits fileUploaded event', function () {
      sinon.assert.calledWith(scope.$emit, 'fileUploaded', 'FILE DATA', scope.locale);
    });

    it('runs validations on file picker 101 error', function () {
      const FP = this.$inject('filepicker');
      FP.pick.rejects({code: 101});

      scope.uploadFile();
      this.$apply();
      sinon.assert.calledOnce(scope.editorContext.validator.run);
    });
  });

  describe('scope.deleteFile()', function () {
    beforeEach(function () {
      scope.$emit = sinon.stub();
      fieldApi.removeValue = sinon.stub().resolves();

      const FP = this.$inject('filepicker');
      FP.parseFPFile.withArgs(null).returns(null);

      scope.deleteFile();
      this.$apply();
    });

    it('removes the value from the field API', function () {
      sinon.assert.calledOnce(fieldApi.removeValue);
    });

    it('sets "scope.file" to "null"', function () {
      expect(scope.file).toBe(null);
    });

    it('it does not emit "fileUploaded" event', function () {
      sinon.assert.notCalled(scope.$emit);
    });
  });

  describe('on "cfFileDropped" event', function () {
    beforeEach(function () {
      fieldApi.setValue = sinon.stub().resolves();

      const FP = this.$inject('filepicker');
      FP.pick.resolves('FP FILE');
      FP.parseFPFile.returns('FILE DATA');

      scope.$emit = sinon.stub();

      scope.$broadcast('cfFileDropped', 'FP FILE');
      this.$apply();
    });

    it('sets the file on the field API', function () {
      sinon.assert.calledOnce(fieldApi.setValue);
      sinon.assert.calledWithExactly(fieldApi.setValue, 'FILE DATA');
    });

    it('sets "scope.file"', function () {
      expect(scope.file).toEqual('FILE DATA');
    });

    it('emits fileUploaded event', function () {
      sinon.assert.calledWith(scope.$emit, 'fileUploaded', 'FILE DATA', scope.locale);
    });

    it('runs validations on file picker 101 error', function () {
      const FP = this.$inject('filepicker');
      FP.pick.rejects({code: 101});

      scope.uploadFile();
      this.$apply();
      sinon.assert.calledOnce(scope.editorContext.validator.run);
    });
  });

  it('shows progress bar when image is loading', function () {
    fieldApi.onValueChanged.yield({
      url: '//images.contentful.com',
      contentType: 'image/png'
    });

    this.$apply();
    const loader = this.el.find('[data-test-id="image-loading"]');
    expect(loader.attr('aria-busy')).toBe('true');
    expect(loader.is(':visible')).toBe(true);

    this.el.find('img').trigger('load');
    this.$apply();
    expect(loader.attr('aria-busy')).toBe('false');
    expect(loader.is(':visible')).toBe(false);
  });
});
