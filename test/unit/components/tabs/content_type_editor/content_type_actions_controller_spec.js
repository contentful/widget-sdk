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
      go: sinon.stub()
    };

    var $controller = this.$inject('$controller');
    controller = $controller('ContentTypeActionsController', {$scope: scope});
  });

  afterEach(function () {
    this.broadcastStub.restore();
  });

  describe('when deleting', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(contentType, 'delete').returns(this.actionDeferred.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionDeferred.reject({error: true});
        controller.delete();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });


      it('shows error notification', function() {
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionDeferred.resolve({contentType: true});
        controller.delete();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('broadcasts event', function() {
        sinon.assert.calledWith(this.broadcastStub, 'entityDeleted');
      });
    });
  });

  it('when cancelling navigates back to list', function() {
    controller.cancel();
    sinon.assert.called(scope.$state.go, '^.list');
  });

  describe('when unpublishing', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(contentType, 'unpublish').returns(this.actionDeferred.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionDeferred.reject({body: {message: ''}});
        controller.unpublish();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.error);
      });

      it('captures server error', function() {
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionDeferred.resolve({contentType: true});
        this.unregisterPublishedContentTypeStub = sinon.stub(scope.spaceContext, 'unregisterPublishedContentType');
        scope.updatePublishedContentType = this.updatePublishedContentTypeStub;
        this.refreshContentTypesStub = sinon.stub(scope.spaceContext, 'refreshContentTypes');
        controller.unpublish();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('tracks analytics event', function() {
        sinon.assert.called(stubs.track);
      });

      it('updated published content type', function() {
        sinon.assert.called(this.updatePublishedContentTypeStub);
      });

      it('unregisters published content type', function() {
        sinon.assert.called(this.unregisterPublishedContentTypeStub);
      });

      it('refreshes content types', function() {
        sinon.assert.called(this.refreshContentTypesStub);
      });
    });
  });


  describe('controller.save()', function() {
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
      return controller.save()
      .then(function () {
        expect(scope.contentTypeForm.$pristine).toBe(true);
      });
    });

    pit('saves and publishes content type', function () {
      return controller.save()
      .then(function () {
        var ct = scope.contentType;
        sinon.assert.calledOnce(ct.save);
        sinon.assert.calledOnce(ct.publish);
        sinon.assert.calledOnce(scope.updatePublishedContentType);
        expect(ct.getPublishedVersion()).toEqual(ct.getVersion());
      });
    });

    pit('creates new editing interface', function () {
      return controller.save()
      .then(function () {
        sinon.assert.calledOnce(scope.contentType.newEditingInterface);
      });
    });

    pit('saves editing interface', function () {
      return controller.save()
      .then(function () {
        sinon.assert.calledOnce(scope.editingInterface.save);
      });
    });

    describe('with invalid data', function () {
      beforeEach(function () {
        scope.validate.returns(false);
      });

      pit('does not save entities', function () {
        return controller.save()
        .catch(function () {
          sinon.assert.notCalled(scope.editingInterface.save);
          sinon.assert.notCalled(scope.contentType.save);
        });
      });

      pit('shows error message', function () {
        return controller.save()
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
        return controller.save()
        .catch(function (err) {
          expect(err).toBe('err');
        });
      });

      pit('does not publish content type', function () {
        return controller.save()
        .catch(function () {
          sinon.assert.notCalled(scope.contentType.publish);
        });
      });

      pit('shows error message', function () {
        return controller.save()
        .catch(function () {
          sinon.assert.called(notification.error);
        });
      });

      pit('does not reset form', function () {
        return controller.save()
        .catch(function () {
          expect(scope.contentTypeForm.$pristine).toBe(false);
        });
      });
    });

    pit('redirects if the content type is new', function() {
      scope.context.isNew = true;
      return controller.save()
      .then(function () {
        sinon.assert.called(scope.$state.go, 'spaces.detail.content_types.detail', {contentTypeId: 'typeid'});
      });
    });
  });

  describe('controller.canSave()', function () {
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

    it('is false when form is pristine', function () {
      expect(controller.canSave()).toBe(true);
      scope.contentTypeForm.$dirty = false;
      expect(controller.canSave()).toBe(false);
    });

    it('is true when form is pristine and Content Type unpublished', function () {
      expect(controller.canSave()).toBe(true);
      scope.contentTypeForm.$dirty = false;
      delete scope.contentType.data.sys.publishedVersion;
      expect(controller.canSave()).toBe(true);
    });

    it('is false when content type has no fields', function () {
      expect(controller.canSave()).toBe(true);
      scope.contentType.data.fields = [];
      expect(controller.canSave()).toBe(false);
      scope.contentType.data.fields = null;
      expect(controller.canSave()).toBe(false);
    });

    it('is false when all fields are disabled', function () {
      expect(controller.canSave()).toBe(true);
      scope.contentType.data.fields[0].disabled = true;
      expect(controller.canSave()).toBe(false);
    });
  });

});
