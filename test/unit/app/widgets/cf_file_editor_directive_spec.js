import sinon from 'sinon';
import { $initialize, $inject, $compile, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

xdescribe('cfFileEditor Directive', () => {
  beforeEach(async function() {
    this.stubs = {
      pick: sinon.stub().resolves({ fileName: 'x.jpg' }),
      Notification_error: sinon.stub()
    };
    this.system.set('services/Filestack', {
      makeDropPane: sinon.stub(),
      pick: this.stubs.pick
    });

    this.system.set('services/TokenStore', {
      getDomains: sinon.stub().returns({})
    });

    const ComponentLibrary = await this.system.import('@contentful/forma-36-react-components');
    ComponentLibrary.Notification.error = this.stubs.Notification_error;

    await $initialize(this.system);

    const cfWidgetApi = $inject('mocks/widgetApi').create();
    this.fieldApi = cfWidgetApi.field;
    this.fieldApi.setValue = sinon.stub().resolves();
    this.fieldApi.removeValue = sinon.stub().resolves();

    const editorContext = $inject('mocks/entityEditor/Context').create();

    this.el = $compile(
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

  describe('scope.selectFile()', () => {
    beforeEach(function() {
      this.scope.selectFile();
      $apply();
    });

    it('calls Filestack.pick', function() {
      sinon.assert.called(this.stubs.pick);
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
      $apply();
      // called once in the intial run
      sinon.assert.calledOnce(this.scope.otDoc.setValueAt);
    });

    it('runs validations on file upload errors', function() {
      this.stubs.pick.rejects(new Error());
      this.scope.selectFile();
      $apply();
      // 1. set value, 2. catch error
      sinon.assert.calledTwice(this.scope.editorContext.validator.run);
    });

    it('removes value and shows error when asset processing fails', function() {
      this.scope.editorData.entity.process = sinon.stub().rejects();
      this.scope.selectFile();
      $apply();
      // both called once in the second run
      sinon.assert.calledOnce(this.fieldApi.removeValue);
      sinon.assert.calledOnce(this.stubs.Notification_error);
    });
  });

  describe('scope.deleteFile()', () => {
    beforeEach(function() {
      this.fieldApi.removeValue = sinon.stub().resolves();
      this.scope.deleteFile();
      $apply();
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

    $apply();
    const loader = this.el.find('.file-progress:first');
    expect(loader.is(':visible')).toBe(true);

    this.el.find('img').trigger('load');
    $apply();
    expect(loader.is(':visible')).toBe(false);
  });

  it('processes unprocessed asset', function() {
    this.fieldApi.onValueChanged.yield({
      upload: '//images.contentful.com'
    });
    this.assertProcessesAndValidatesAsset();
  });
});
