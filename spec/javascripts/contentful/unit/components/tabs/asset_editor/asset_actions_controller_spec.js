'use strict';

describe('Asset Actions Controller', function () {
  var controller, scope, stubs;
  var space, asset;
  var $q, action;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'serverError', 'warn', 'info', 'otUpdateEntity', 'getAt', 'logServerError'
      ]);
      $provide.value('notification', {
        serverError: stubs.serverError,
        info: stubs.info,
        warn: stubs.warn
      });
      $provide.value('logger', {
        logServerError: stubs.logServerError
      });
    });
    inject(function ($controller, $rootScope, cfStub, _$q_) {
      $q = _$q_;
      space = cfStub.space('spaceid');
      var contentTypeData = cfStub.contentTypeData('type1');
      asset = cfStub.asset(space, 'assetid');
      action = $q.defer();

      scope = $rootScope.$new();
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      scope.asset = asset;
      scope.broadcastFromSpace = sinon.stub();
      controller = $controller('AssetActionsController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('when deleting', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'delete').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({error: true});
        scope.delete();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });


      it('shows error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        scope.delete();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows notification', function() {
        expect(stubs.info).toBeCalled();
      });

      it('broadcasts event', function() {
        expect(scope.broadcastFromSpace).toBeCalledWith('entityDeleted');
      });
    });
  });

  describe('when archiving', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'archive').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        scope.archive();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows error notification', function() {
        expect(stubs.logServerError).toBeCalled();
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        scope.archive();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows notification', function() {
        expect(stubs.info).toBeCalled();
      });
    });
  });

  describe('when unarchiving', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'unarchive').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        scope.unarchive();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows error notification', function() {
        expect(stubs.logServerError).toBeCalled();
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        scope.unarchive();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows notification', function() {
        expect(stubs.info).toBeCalled();
      });
    });
  });

  describe('when unpublishing', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(asset, 'unpublish').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        scope.unpublish();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows error notification', function() {
        expect(stubs.logServerError).toBeCalled();
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({asset: true});
        scope.otUpdateEntity = stubs.otUpdateEntity;
        scope.unpublish();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows notification', function() {
        expect(stubs.info).toBeCalled();
      });

      it('updates ot entity', function() {
        expect(scope.otUpdateEntity).toBeCalled();
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
        scope.publish();
        scope.$apply();
      });

      it('calls validation', function() {
        expect(scope.validate).toBeCalled();
      });

      it('shows warn notification', function() {
        expect(stubs.warn).toBeCalled();
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
        scope.publish();
        scope.$apply();
      });

      it('calls validation', function() {
        expect(scope.validate).toBeCalled();
      });

      it('sets validation errors', function() {
        expect(scope.setValidationErrors).toBeCalledWith(errors);
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows error notification', function() {
        expect(stubs.warn).toBeCalled();
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
        scope.publish();
        scope.$apply();
      });

      it('calls validation', function() {
        expect(scope.validate).toBeCalled();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows error notification', function() {
        expect(stubs.warn).toBeCalled();
      });

      it('gets contextual error message', function() {
        expect(stubs.warn.args[0][0]).toMatch(/version/i);
      });
    });

    describe('fails with a remote error', function() {
      var errors;
      beforeEach(function() {
        errors = {errors: true};
        action.reject({
          body: {
            sys: {
              id: 'remote error'
            },
          }
        });
        scope.validate.returns(true);
        scope.publish();
        scope.$apply();
      });

      it('calls validation', function() {
        expect(scope.validate).toBeCalled();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });

      it('gets contextual error message', function() {
        expect(stubs.serverError.args[0][0]).toMatch(/remote/i);
      });
    });

    describe('succeeds', function() {
      var versionStub;
      beforeEach(function() {
        action.resolve({asset: true});
        scope.validate.returns(true);
        scope.otUpdateEntity = stubs.otUpdateEntity;
        versionStub = sinon.stub(asset, 'setPublishedVersion');
        scope.publish();
        scope.$apply();
      });

      it('calls validation', function() {
        expect(scope.validate).toBeCalled();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows notification', function() {
        expect(stubs.info).toBeCalled();
      });

      it('updates ot entity', function() {
        expect(versionStub).toBeCalledWith(1);
      });
    });
  });

  describe('getting the publish button label', function() {
    beforeEach(function() {
      scope.otDoc = {
        getAt: stubs.getAt
      };
    });

    it('not published yet', function() {
      stubs.getAt.returns(false);
      expect(scope.publishButtonLabel()).toBe('Publish');
    });

    it('already published', function() {
      stubs.getAt.returns(true);
      expect(scope.publishButtonLabel()).toBe('Republish');
    });
  });

});
