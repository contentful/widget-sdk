'use strict';

describe('Asset Actions Controller', function () {
  var controller, scope, stubs, logger, notification;
  var space, asset;
  var $q, action;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([ 'otUpdateEntity', 'getAt' ]);
    });
    inject(function ($controller, $rootScope, cfStub, $injector) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      this.broadcastStub = sinon.stub($rootScope, '$broadcast');
      this.broadcastStub.returns({});
      logger = $injector.get('logger');
      notification = $injector.get('notification');
      space = cfStub.space('spaceid');
      var contentTypeData = cfStub.contentTypeData('type1');
      asset = cfStub.asset(space, 'assetid');
      action = $q.defer();

      scope = $rootScope.$new();
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      scope.asset = asset;
      controller = $controller('AssetActionsController', {$scope: scope});
    });
  });

  afterEach(function () {
    this.broadcastStub.restore();
  });

  describe('#delete command', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'delete').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({error: true});
        controller.delete.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });


      it('shows error notification', function() {
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        controller.delete.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('broadcasts event', function() {
        sinon.assert.calledWith(this.broadcastStub, 'entityDeleted');
      });
    });
  });

  describe('#archive command', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'archive').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        controller.archive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.warn);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        controller.archive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });
    });
  });

  describe('#unarchive command', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'unarchive').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        controller.unarchive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.warn);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        controller.unarchive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });
    });
  });

  describe('#unpublish commmand', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'unpublish').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        controller.unpublish.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.warn);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        scope.otUpdateEntity = stubs.otUpdateEntity;
        controller.unpublish.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('updates ot entity', function() {
        sinon.assert.called(scope.otUpdateEntity);
      });
    });
  });

  describe('when publishing', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'publish').returns(action.promise);
      scope.validate = sinon.stub();
    });

    describe('fails due to validation', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        scope.validate.returns(false);
        controller.publish.execute();
        this.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(scope.validate);
      });

      it('shows warn notification', function() {
        sinon.assert.called(notification.warn);
      });
    });


    describe('fails with a remote validation error', function() {
      var errors;
      beforeEach(function() {
        errors = {errors: true};
        action.reject({
          body: {
            sys: {
              id: 'ValidationFailed'
            },
            details: {
              errors: errors
            }
          }
        });
        scope.validate.returns(true);
        scope.setValidationErrors = sinon.stub();
        controller.publish.execute();
        this.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(scope.validate);
      });

      it('sets validation errors', function() {
        sinon.assert.calledWith(scope.setValidationErrors, errors);
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.warn);
      });
    });

    describe('fails with a version mismatch', function() {
      var errors;
      beforeEach(function() {
        errors = {errors: true};
        action.reject({
          body: {
            sys: {
              id: 'VersionMismatch'
            },
            details: {
              errors: errors
            }
          }
        });
        scope.validate.returns(true);
        controller.publish.execute();
        this.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(scope.validate);
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.warn);
      });

      it('gets contextual error message', function() {
        expect(notification.warn.args[0][0]).toMatch(/version/i);
      });
    });

    describe('fails with a remote error', function() {
      var errors, err;
      beforeEach(function() {
        errors = {errors: true};
        err = {
          body: {
            sys: {
              id: 'remote error'
            },
          }
        };
        action.reject(err);
        scope.validate.returns(true);
        controller.publish.execute();
        this.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(scope.validate);
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });

      it('gets contextual error message', function() {
        expect(logger.logServerWarn.args[0][1]).toEqual({error: err});
      });
    });

    describe('succeeds', function() {
      var versionStub;
      beforeEach(function() {
        action.resolve({asset: true});
        scope.validate.returns(true);
        scope.otUpdateEntity = stubs.otUpdateEntity;
        versionStub = sinon.stub(asset, 'setPublishedVersion');
        controller.publish.execute();
        this.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(scope.validate);
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('updates ot entity', function() {
        sinon.assert.calledWith(versionStub, 1);
      });
    });
  });

});
