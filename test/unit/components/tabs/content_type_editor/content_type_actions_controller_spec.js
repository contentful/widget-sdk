'use strict';

describe('ContentType Actions Controller', function () {
  var controller, scope, stubs, $q, logger, notification, accessChecker, ReloadNotification;
  var space, contentType;

  function FormStub () {
    this.$setDirty = function () {
      this._setDirty(true);
    };

    this.$setPristine = function () {
      this._setDirty(false);
    };

    this._setDirty = function (dirty) {
      this.$dirty = dirty;
      this.$pristine = !dirty;
    };

    this.$setPristine();
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([ 'track']);

      $provide.value('analytics', {
        track: stubs.track
      });
    });

    var $rootScope = this.$inject('$rootScope');
    this.broadcastStub = sinon.spy($rootScope, '$broadcast');

    this.$state = this.$inject('$state');
    this.$state.go = sinon.stub().resolves();

    $q = this.$inject('$q');
    logger = this.$inject('logger');
    notification = this.$inject('notification');
    accessChecker = this.$inject('accessChecker');
    accessChecker.canPerformActionOnEntryOfType = sinon.stub().returns(true);
    ReloadNotification = this.$inject('ReloadNotification');
    ReloadNotification.basicErrorHandler = sinon.spy();

    var cfStub = this.$inject('cfStub');

    space = cfStub.space('spaceid');
    contentType = cfStub.contentType(space, 'typeid', 'typename');

    scope = $rootScope.$new();
    scope.context = {};
    scope.contentType = contentType;
    scope.broadcastFromSpace = sinon.stub();

    var $controller = this.$inject('$controller');
    controller = $controller('ContentTypeActionsController', {$scope: scope});
  });

  afterEach(function () {
    this.broadcastStub.restore();
  });

  describe('#delete command', function() {
    beforeEach(function() {
      contentType.delete = sinon.stub().resolves();
      contentType.unpublish = sinon.stub().resolves();
      contentType.isPublished = sinon.stub().returns(true);

      scope.updatePublishedContentType = sinon.stub();
      scope.ctEditorController = {
        countEntries: sinon.stub().resolves()
      };

      this.modalDialog = this.$inject('modalDialog');
      sinon.stub(this.modalDialog, 'open', function (params) {
        if (params.scope && params.scope.delete) {
          params.scope.delete.execute();
        }
      });
    });

    describe('without entries', function () {
      beforeEach(function () {
        scope.ctEditorController.countEntries.resolves(0);
      });

      it('calls unpublish and then delete', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.callOrder(contentType.unpublish, contentType.delete);
      });

      it('asks the user for confirmation', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(this.modalDialog.open);
      });

      it('does not send DELETE if the user denies confirmation', function () {
        this.modalDialog.open.restore();
        sinon.stub(this.modalDialog, 'open').resolves();

        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(contentType.delete);
      });

      it('notifies of server errors', function() {
        contentType.delete.rejects({error: true});
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });

      it('shows notification', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(notification.info);
      });

      it('broadcasts event', function() {
        controller.delete.execute();
        this.$apply();
        sinon.assert.calledWith(this.broadcastStub, 'entityDeleted');
      });
    });

    describe('delete flow interruptions', function () {
      function testForbiddenRemoval(dialog, data) {
        var matchObj = {
          template: 'content_type_removal_forbidden_dialog',
          scopeData: data || {}
        };

        controller.delete.execute();
        scope.$apply();
        sinon.assert.calledWith(dialog.open, sinon.match(matchObj));
        sinon.assert.notCalled(contentType.delete);
      }

      function testEndpointError() {
        controller.delete.execute();
        scope.$apply();
        sinon.assert.calledOnce(ReloadNotification.basicErrorHandler);
      }

      it('notifies the user when entries endpoint cannot be read', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(false);
        scope.ctEditorController.countEntries.rejects({statusCode: 404});
        testForbiddenRemoval(this.modalDialog, {count: ''});
      });

      it('notifies the user when entries cannot be read due to policy', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(false);
        scope.ctEditorController.countEntries.resolves(0);
        testForbiddenRemoval(this.modalDialog, {count: ''});
      });

      it('notifies the user when there are entries', function () {
        scope.ctEditorController.countEntries.resolves(1);
        testForbiddenRemoval(this.modalDialog, {count: 1});
      });

      it('fails for 404 when entries can be read by policy', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(true);
        scope.ctEditorController.countEntries.rejects({statusCode: 404});
        testEndpointError();
      });

      it('fails for non-404 status codes', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(true);
        scope.ctEditorController.countEntries.rejects({statusCode: 500});
        testEndpointError();
      });
    });

    describe('when CT is not published', function () {
      beforeEach(function () {
        contentType.isPublished = sinon.stub().returns(false);
      });

      it('does not count entries', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(scope.ctEditorController.countEntries);
      });

      it('does not call unpublish', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(contentType.unpublish);
      });

      it('calls delete', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(contentType.delete);
      });
    });

  });

  it('when cancelling navigates back to list', function() {
    controller.cancel.execute();
    sinon.assert.called(this.$state.go, '^.list');
  });

  describe('#save command', function() {
    var spaceContext;

    beforeEach(function() {
      var cfStub = this.$inject('cfStub');
      spaceContext = cfStub.spaceContext(space, []);
      spaceContext.editingInterfaces = {
        save: sinon.stub()
      };

      scope.contentTypeForm = new FormStub();
      scope.contentTypeForm.$setDirty();

      scope.validate = sinon.stub().returns(true);

      scope.editingInterface = {};

      scope.contentType.save = sinon.stub().returns(this.when(scope.contentType));
      scope.contentType.publish = sinon.stub().returns(this.when(scope.contentType));

      scope.updatePublishedContentType = sinon.stub();
    });

    pit('resets form and state context to pristine state', function () {
      scope.context.dirty = true;
      return controller.save.execute()
      .then(function () {
        expect(scope.context.dirty).toBe(false);
        expect(scope.contentTypeForm.$pristine).toBe(true);
      });
    });

    pit('saves and publishes content type', function () {
      return controller.save.execute()
      .then(function () {
        var ct = scope.contentType;
        sinon.assert.calledOnce(ct.save);
        sinon.assert.calledOnce(ct.publish);
        sinon.assert.calledOnce(scope.updatePublishedContentType);
        expect(ct.getPublishedVersion()).toEqual(ct.getVersion());
      });
    });

    pit('saves editing interface', function () {
      return controller.save.execute()
      .then(function () {
        sinon.assert.calledOnce(spaceContext.editingInterfaces.save);
      });
    });

    describe('with invalid data', function () {
      beforeEach(function () {
        scope.validate.returns(false);
        scope.validationResult = {errors: []};
      });

      pit('does not save entities', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.notCalled(spaceContext.editingInterfaces.save);
          sinon.assert.notCalled(scope.contentType.save);
        });
      });

      pit('shows error message', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.called(notification.error);
        });
      });
    });

    describe('content type server error', function () {
      beforeEach(function () {
        scope.contentType.save.returns(this.reject('err'));
      });

      pit('rejects promise', function () {
        return controller.save.execute()
        .catch(function (err) {
          expect(err).toBe('err');
        });
      });

      pit('does not publish content type', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.notCalled(scope.contentType.publish);
        });
      });

      pit('shows error message', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.called(notification.error);
        });
      });

      pit('does not reset form', function () {
        return controller.save.execute()
        .catch(function () {
          expect(scope.contentTypeForm.$pristine).toBe(false);
        });
      });
    });

    pit('redirects if the content type is new', function() {
      var goStub = this.$state.go;
      scope.context.isNew = true;
      return controller.save.execute()
      .then(function () {
        sinon.assert.called(goStub, 'spaces.detail.content_types.detail', {contentTypeId: 'typeid'});
      });
    });

    describe('field removal', function () {

      beforeEach(function () {
        var published = { data: {fields: [{id: 'A'}]} };
        scope.publishedContentType = published;
        scope.contentType.unpublish = sinon.stub().resolves(published);
      });

      pit('unpublishes content type', function () {
        return controller.save.execute()
        .then(function () {
          sinon.assert.callOrder(
            scope.contentType.unpublish,
            scope.contentType.save,
            scope.contentType.publish
          );
        });
      });

      pit('does not unpublish if no field removed', function () {
        scope.contentType.data.fields = [{id: 'A'}, {id: 'B'}];
        return controller.save.execute()
        .then(function () {
          sinon.assert.notCalled(scope.contentType.unpublish);
        });
      });

      describe('after unpublishing', function () {
        pit('retains local content type data', function () {
          scope.contentType.data = 'LOCAL';
          scope.contentType.unpublish = function () {
            this.data = 'UNPULBISHED';
            return $q.when(this);
          };
          return controller.save.execute()
          .then(function () {
            expect(scope.contentType.data).toEqual('LOCAL');
          });
        });

        pit('updates version', function () {
          scope.contentType.data = {};
          scope.contentType.unpublish = function () {
            this.data = {sys: 'NEW SYS'};
            return $q.when(this);
          };
          return controller.save.execute()
          .then(function () {
            expect(scope.contentType.data.sys).toEqual('NEW SYS');
          });
        });
      });
    });
  });

  describe('#save command disabled', function () {
    beforeEach(function () {
      scope.contentTypeForm = {
        $dirty: true,
      };
      scope.contentType.data.fields = [
        { disabled: false },
        { disabled: true }
      ];
      scope.contentType.data.sys.publishedVersion = 1;
    });

    it('is true when form is pristine', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentTypeForm.$dirty = false;
      expect(controller.save.isDisabled()).toBe(true);
    });

    it('is false when form is pristine and Content Type unpublished', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentTypeForm.$dirty = false;
      delete scope.contentType.data.sys.publishedVersion;
      expect(controller.save.isDisabled()).toBe(false);
    });

    it('is true when content type has no fields', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentType.data.fields = [];
      expect(controller.save.isDisabled()).toBe(true);
      scope.contentType.data.fields = null;
      expect(controller.save.isDisabled()).toBe(true);
    });

    it('is false when all fields are disabled', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentType.data.fields[0].disabled = true;
      expect(controller.save.isDisabled()).toBe(true);
    });
  });

});
