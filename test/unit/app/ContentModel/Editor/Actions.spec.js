import sinon from 'sinon';
import _ from 'lodash';

describe('app/ContentModel/Editor/Actions.es6', () => {
  let controller, scope, $q, logger, notification, accessChecker, spaceContext, stubs;
  let space, contentType;

  beforeEach(function() {
    const self = this;

    stubs = {
      ReloadNotification: {
        basicErrorHandler: sinon.stub()
      }
    };

    module('contentful/test', $provide => {
      $provide.constant('navigation/closeState', (self.closeSpy = sinon.spy()));
      $provide.value('utils/LaunchDarkly/index.es6', {
        getCurrentVariation: sinon.stub().callsFake(() => Promise.resolve(false))
      });
      $provide.value('app/common/ReloadNotification.es6', stubs.ReloadNotification);
      $provide.constant('services/logger.es6', {
        logServerWarn: sinon.stub(),
        findActualServerError: sinon.stub()
      });
    });

    this.$state = this.$inject('$state');
    this.$state.go = sinon.stub().resolves();

    $q = this.$inject('$q');
    logger = this.$inject('services/logger.es6');
    const ComponentLibrary = this.$inject('@contentful/forma-36-react-components');
    notification = ComponentLibrary.Notification;
    notification.success = sinon.stub();
    notification.error = sinon.stub();
    accessChecker = this.$inject('access_control/AccessChecker');
    accessChecker.canPerformActionOnEntryOfType = sinon.stub().returns(true);

    this.cfStub = this.$inject('cfStub');

    spaceContext = this.$inject('spaceContext');
    spaceContext.resetWithSpace(this.cfStub.space('spaceid').data);
    space = spaceContext.space;
    spaceContext.uiConfig = { addOrEditCt: () => {} };
    contentType = this.cfStub.contentType(space, 'typeid', 'typename');

    scope = this.$inject('$rootScope').$new();
    scope.context = {};
    scope.contentType = contentType;
    scope.broadcastFromSpace = sinon.stub();

    controller = this.$inject('app/ContentModel/Editor/Actions.es6').default(scope);
  });

  describe('#delete command', () => {
    beforeEach(function() {
      contentType.delete = sinon.stub().resolves();
      contentType.unpublish = sinon.stub().resolves(contentType);
      contentType.isPublished = sinon.stub().returns(true);

      space.getEntries = sinon.stub().resolves([]);

      this.modalDialog = this.$inject('modalDialog');
      sinon.stub(this.modalDialog, 'open').callsFake(params => {
        if (params.controller) {
          const $scope = this.$inject('$rootScope').$new();
          params.controller($scope);
          $scope.delete.execute();
        }
      });
    });

    describe('without entries', () => {
      it('calls unpublish and then delete', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.callOrder(contentType.unpublish, contentType.delete);
      });

      it('asks the user for confirmation', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(this.modalDialog.open);
      });

      it('does not send DELETE if the user denies confirmation', function() {
        this.modalDialog.open.restore();
        sinon.stub(this.modalDialog, 'open').resolves();

        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(contentType.delete);
      });

      it('notifies of server errors', function() {
        contentType.delete.rejects({ error: true });
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });

      it('shows notification', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(notification.success);
      });

      it('closes state', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.calledOnce(this.closeSpy);
      });
    });

    describe('delete flow interruptions', () => {
      function testEndpointError() {
        controller.delete.execute();
        scope.$apply();
        sinon.assert.calledOnce(stubs.ReloadNotification.basicErrorHandler);
      }

      it('fails for 404 when entries can be read by policy', () => {
        accessChecker.canPerformActionOnEntryOfType.returns(true);
        space.getEntries.rejects({ statusCode: 404 });
        testEndpointError();
      });

      it('fails for non-404 status codes', () => {
        accessChecker.canPerformActionOnEntryOfType.returns(true);
        space.getEntries.rejects({ statusCode: 500 });
        testEndpointError();
      });
    });

    describe('when CT is not published', () => {
      beforeEach(() => {
        contentType.isPublished = sinon.stub().returns(false);
      });

      it('does not count entries', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(space.getEntries);
      });

      it('does not call unpublish', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(contentType.unpublish);
      });

      it('calls delete', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(contentType.delete);
      });
    });
  });

  it('when cancelling navigates back to list', function() {
    controller.cancel.execute();
    sinon.assert.calledWith(this.$state.go, '^.^.list');
  });

  describe('#save command', () => {
    beforeEach(function() {
      spaceContext.cma.updateEditorInterface = sinon.stub().resolves({
        sys: { version: 2 },
        controls: []
      });
      spaceContext.cma.getEditorInterface = sinon.stub().resolves({
        sys: { version: 1 },
        controls: []
      });

      scope.validate = sinon.stub().returns(true);

      scope.editorInterface = { sys: {} };

      scope.contentType.data.fields = [{ type: 'Symbol', id: 'test' }];
      scope.contentType.save = sinon.stub().returns(this.when(scope.contentType));
      scope.contentType.publish = sinon.stub().returns(this.when(scope.contentType));
    });

    it('resets form and state context to pristine state', () => {
      scope.context.dirty = true;
      return controller.save.execute().then(() => {
        expect(scope.context.dirty).toBe(false);
      });
    });

    it('saves and publishes content type', () =>
      controller.save.execute().then(() => {
        const ct = scope.contentType;
        sinon.assert.calledOnce(ct.save);
        sinon.assert.calledOnce(ct.publish);
      }));

    it('saves editor interface', () => {
      return controller.save.execute().then(() => {
        sinon.assert.calledOnce(spaceContext.cma.updateEditorInterface);

        expect(spaceContext.cma.updateEditorInterface.args[0][0]).toEqual({
          sys: { version: 1 },
          controls: [{ fieldId: 'test', widgetId: 'singleLine', widgetNamespace: 'builtin' }],
          sidebar: undefined
        });
      });
    });

    it('updates editor interface on scope', function() {
      return controller.save.execute().then(() => {
        expect(scope.editorInterface).toEqual({
          sys: { version: 2 },
          controls: [
            {
              fieldId: 'test',
              widgetNamespace: 'builtin',
              widgetId: 'singleLine',
              field: { type: 'Symbol', id: 'test' }
            }
          ],
          sidebar: undefined
        });
      });
    });

    describe('with invalid data', () => {
      beforeEach(() => {
        scope.validate.returns(false);
        scope.validationResult = { errors: [] };
      });

      it('does not save entities', () =>
        controller.save.execute().catch(() => {
          sinon.assert.notCalled(spaceContext.cma.updateEditorInterface);
          sinon.assert.notCalled(scope.contentType.save);
        }));

      it('shows error message', () =>
        controller.save.execute().catch(() => {
          sinon.assert.called(notification.error);
        }));
    });

    describe('content type server error', () => {
      beforeEach(function() {
        scope.context.dirty = true;
        scope.contentType.save.returns(this.reject('err'));
      });

      it('rejects promise', () =>
        controller.save.execute().catch(err => {
          expect(err).toBe('err');
        }));

      it('does not publish content type', () =>
        controller.save.execute().catch(() => {
          sinon.assert.notCalled(scope.contentType.publish);
        }));

      it('shows error message', () =>
        controller.save.execute().catch(() => {
          sinon.assert.called(notification.error);
        }));

      it('does not reset form', () =>
        controller.save.execute().catch(() => {
          expect(scope.context.dirty).toBe(true);
        }));
    });

    it('redirects if the content type is new', function*() {
      scope.context.isNew = true;
      yield controller.save.execute();
      sinon.assert.calledWith(
        this.$state.go,
        '^.^.detail.fields',
        sinon.match({ contentTypeId: 'typeid' })
      );
    });
  });

  describe('#save command disabled', () => {
    beforeEach(() => {
      scope.context.dirty = true;
      scope.contentType.data.fields = [{ disabled: false }, { disabled: true }];
      scope.contentType.data.sys.publishedVersion = 1;
    });

    it('is true when form is pristine', () => {
      expect(controller.save.isDisabled()).toBe(false);
      scope.context.dirty = false;
      expect(controller.save.isDisabled()).toBe(true);
    });

    it('is false when form is pristine and Content Type unpublished', () => {
      expect(controller.save.isDisabled()).toBe(false);
      scope.context.dirty = false;
      delete scope.contentType.data.sys.publishedVersion;
      expect(controller.save.isDisabled()).toBe(false);
    });

    it('is true when content type has no fields', () => {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentType.data.fields = [];
      expect(controller.save.isDisabled()).toBe(true);
      scope.contentType.data.fields = null;
      expect(controller.save.isDisabled()).toBe(true);
    });

    it('is false when all fields are disabled', () => {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentType.data.fields[0].disabled = true;
      expect(controller.save.isDisabled()).toBe(true);
    });
  });

  describe('#duplicate command', () => {
    function getCreatedCt() {
      return spaceContext.space.newContentType.returnValues[0];
    }

    beforeEach(function() {
      sinon.stub(this.$inject('modalDialog'), 'open').callsFake(params => {
        if (params.scope && params.scope.duplicate) {
          _.extend(params.scope.contentTypeMetadata, { name: 'test', id: 'test' });
          const confirm = sinon.spy();
          params.scope.dialog = {
            confirm: confirm,
            cancel: sinon.spy(),
            formController: { $valid: true }
          };
          return {
            promise: params.scope.duplicate.execute().then(() => confirm.firstCall.args[0])
          };
        }

        if (params.title === 'Duplicated content type') {
          return { promise: $q.resolve() };
        }
      });

      sinon.stub(spaceContext.space, 'newContentType').callsFake(data => {
        const ct = { data: { sys: { id: 'ct-id' } }, name: 'ct-name' };
        _.extend(ct.data, data);
        ct.getId = () => 'ct-id';
        ct.save = sinon.stub().resolves(ct);
        ct.publish = sinon.stub().resolves(ct);
        return ct;
      });

      scope.editorInterface = { sys: {}, controls: [] };
      spaceContext.cma.updateEditorInterface = sinon.stub().resolves();
    });

    it('creates new content types type with a provided name', () =>
      controller.duplicate.execute().then(() => {
        sinon.assert.calledOnce(spaceContext.space.newContentType);
        expect(spaceContext.space.newContentType.firstCall.args[0].name).toBe('test');
      }));

    it('saves a duplicate with the same field IDs and display field', () => {
      contentType.data.displayField = 'field-id-2-disp';
      contentType.data.fields = [{ id: 'field-id-1' }, { id: 'field-id-2-disp' }];

      return controller.duplicate.execute().then(() => {
        const ct = getCreatedCt();
        sinon.assert.calledOnce(ct.save);
        expect(typeof ct.data.displayField).toBe('string');
        expect(ct.data.displayField).toBe(contentType.data.displayField);
        expect(ct.data.displayField).toBe(ct.data.fields[1].id);
        expect(ct.data.fields[0].id).toBe(contentType.data.fields[0].id);
        expect(ct.data.fields[1].id).toBe(contentType.data.fields[1].id);
      });
    });

    it('publishes content type duplicate', () =>
      controller.duplicate.execute().then(() => {
        sinon.assert.calledOnce(getCreatedCt().publish);
      }));

    it('synchronizes controls in the new EI', () => {
      contentType.data.fields = [{ id: 'xyz' }, { id: 'boom' }];
      scope.editorInterface.controls = [
        { fieldId: 'xyz', widgetId: 'margarita-making-widget' },
        { fieldId: 'boom', widgetId: 'some-other-widget' }
      ];

      return controller.duplicate.execute().then(() => {
        sinon.assert.calledOnce(spaceContext.cma.updateEditorInterface);
        const ei = spaceContext.cma.updateEditorInterface.firstCall.args[0];
        expect(ei.controls[0].widgetId).toBe('margarita-making-widget');
        expect(ei.controls[1].widgetId).toBe('some-other-widget');
      });
    });
  });

  describe('#duplicate command disabled', () => {
    beforeEach(() => {
      scope.context.isNew = false;
      scope.context.dirty = false;
      scope.contentType.data.sys.publishedVersion = 100;
      scope.contentType.isPublished = _.constant(true);
      accessChecker.shouldDisable = _.constant(false);
      expect(controller.duplicate.isDisabled()).toBe(false);
    });

    it('is true when content type is new', () => {
      scope.context.isNew = true;
      expect(controller.duplicate.isDisabled()).toBe(true);
    });

    it('is true when from is dirty', () => {
      scope.context.dirty = true;
      expect(controller.duplicate.isDisabled()).toBe(true);
      scope.context.dirty = false;
      delete scope.contentType.data.sys.publishedVersion;
      expect(controller.duplicate.isDisabled()).toBe(true);
    });

    it('is true when update/create are denied', () => {
      accessChecker.shouldDisable = _.constant(true);
      expect(controller.duplicate.isDisabled()).toBe(true);
    });

    it('is true when content type is not published', () => {
      scope.contentType.isPublished = _.constant(false);
      expect(controller.duplicate.isDisabled()).toBe(true);
    });
  });
});
