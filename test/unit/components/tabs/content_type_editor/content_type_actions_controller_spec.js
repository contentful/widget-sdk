'use strict';

describe('ContentType Actions Controller', function () {
  var controller, scope, stubs, logger, notification;
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

    logger = this.$inject('logger');
    notification = this.$inject('notification');

    var $q = this.$inject('$q');
    var cfStub = this.$inject('cfStub');

    space = cfStub.space('spaceid');
    contentType = cfStub.contentType(space, 'typeid', 'typename');

    this.updatePublishedContentTypeStub = sinon.stub();
    this.actionDeferred = $q.defer();
    var contentTypeData = cfStub.contentTypeData('type1');

    scope = $rootScope.$new();
    scope.context = {};
    scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
    scope.contentType = contentType;
    scope.broadcastFromSpace = sinon.stub();
    scope.regulateDisplayField = sinon.stub();
    scope.$state = {
      go: sinon.stub().resolves()
    };

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
      sinon.stub(this.modalDialog, 'openConfirmDialog').resolves({cancelled: false});
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
        sinon.assert.called(this.modalDialog.openConfirmDialog);
      });

      it('does not send DELETE if the user denies confirmation', function () {
        this.modalDialog.openConfirmDialog.resolves({cancelled: true});

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

    it('notifies the user when there are entries', function () {
      scope.ctEditorController.countEntries.resolves(1);
      controller.delete.execute();
      this.$apply();

      sinon.assert.calledWith(
        this.modalDialog.openConfirmDialog,
        sinon.match({template: 'content_type_removal_forbidden_dialog'})
      );
      sinon.assert.notCalled(contentType.delete);
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
    sinon.assert.called(scope.$state.go, '^.list');
  });

  describe('#save command', function() {
    beforeEach(function() {

      scope.contentTypeForm = new FormStub();
      scope.contentTypeForm.$setDirty();

      scope.validate = sinon.stub().returns(true);

      scope.editingInterface = {
        data: {},
        save: sinon.stub().returns(this.when()),
        getVersion: sinon.stub()
      };
      scope.editingInterface.getVersion.returns(0);

      scope.contentType.save = sinon.stub().returns(this.when(scope.contentType));
      scope.contentType.publish = sinon.stub().returns(this.when(scope.contentType));
      scope.contentType.newEditingInterface = sinon.stub().returns(scope.editingInterface);

      scope.updatePublishedContentType = sinon.stub();
    });

    pit('resets form to pristine state', function () {
      return controller.save.execute()
      .then(function () {
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

    pit('creates new editing interface', function () {
      return controller.save.execute()
      .then(function () {
        sinon.assert.calledOnce(scope.contentType.newEditingInterface);
      });
    });

    pit('saves editing interface', function () {
      return controller.save.execute()
      .then(function () {
        sinon.assert.calledOnce(scope.editingInterface.save);
      });
    });

    describe('with invalid data', function () {
      beforeEach(function () {
        scope.validate.returns(false);
      });

      pit('does not save entities', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.notCalled(scope.editingInterface.save);
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
      scope.context.isNew = true;
      return controller.save.execute()
      .then(function () {
        sinon.assert.called(scope.$state.go, 'spaces.detail.content_types.detail', {contentTypeId: 'typeid'});
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
          var $q = this.$inject('$q');
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
          var $q = this.$inject('$q');
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

    pit('sets default name', function () {
      var ct = scope.contentType;
      delete ct.data.name;
      return controller.save.execute()
      .then(function () {
        expect(ct.data.name).toEqual('Untitled');
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
