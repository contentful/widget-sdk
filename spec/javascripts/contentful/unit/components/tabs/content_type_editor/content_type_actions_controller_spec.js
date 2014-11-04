'use strict';

describe('ContentType Actions Controller', function () {
  var controller, scope, stubs, action, $q;
  var space, contentType;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'serverError', 'warn', 'info', 'logServerError', 'track',
        'updatePublishedContentType'
      ]);

      $provide.value('notification', {
        serverError: stubs.serverError,
        info: stubs.info,
        warn: stubs.warn
      });

      $provide.value('logger', {
        logServerError: stubs.logServerError
      });

      $provide.value('analytics', {
        track: stubs.track
      });

    });
    inject(function ($controller, $rootScope, cfStub, _$q_) {
      $q = _$q_;
      space = cfStub.space('spaceid');
      var contentTypeData = cfStub.contentTypeData('type1');
      contentType = cfStub.contentType(space, 'typeid', 'typename');
      action = $q.defer();

      scope = $rootScope.$new();
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      scope.contentType = contentType;
      scope.broadcastFromSpace = sinon.stub();
      scope.sanitizeDisplayField = sinon.stub();
      scope.sanitizeDisplayField.returns($q.when());
      controller = $controller('ContentTypeActionsCtrl', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('when deleting', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(contentType, 'delete').returns(action.promise);
      stubs.removeContentType = sinon.stub(scope.spaceContext, 'removeContentType');
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
        action.resolve({contentType: true});
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

      it('removes content type', function() {
        expect(stubs.removeContentType).toBeCalledWith(contentType);
      });
    });
  });

  describe('when unpublishing', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(contentType, 'unpublish').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {message: ''}});
        scope.unpublish();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows error notification', function() {
        expect(stubs.warn).toBeCalled();
      });

      it('captures server error', function() {
        expect(stubs.logServerError).toBeCalled();
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({contentType: true});
        scope.updatePublishedContentType = stubs.updatePublishedContentType;
        stubs.unregisterPublishedContentType = sinon.stub(scope.spaceContext, 'unregisterPublishedContentType');
        stubs.refreshContentTypes = sinon.stub(scope.spaceContext, 'refreshContentTypes');
        scope.unpublish();
        scope.$apply();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalled();
      });

      it('shows notification', function() {
        expect(stubs.info).toBeCalled();
      });

      it('tracks analytics event', function() {
        expect(stubs.track).toBeCalled();
      });

      it('updated published content type', function() {
        expect(stubs.updatePublishedContentType).toBeCalled();
      });

      it('unregisters published content type', function() {
        expect(stubs.unregisterPublishedContentType).toBeCalled();
      });

      it('refreshes content types', function() {
        expect(stubs.refreshContentTypes).toBeCalled();
      });
    });
  });

  describe('when publishing', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(contentType, 'publish').returns(action.promise);
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
            sys: {},
            message: 'remote error'
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
      beforeEach(function() {
        action.resolve({contentType: true});
        scope.validate.returns(true);
        scope.updatePublishedContentType = stubs.updatePublishedContentType;
        stubs.registerPublishedContentType = sinon.stub(scope.spaceContext, 'registerPublishedContentType');
        stubs.refreshContentTypes = sinon.stub(scope.spaceContext, 'refreshContentTypes');
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

      it('tracks analytics event', function() {
        expect(stubs.track).toBeCalled();
      });

      it('updated published content type', function() {
        expect(stubs.updatePublishedContentType).toBeCalled();
      });

      it('registers published content type', function() {
        expect(stubs.registerPublishedContentType).toBeCalled();
      });

      it('refreshes content types', function() {
        expect(stubs.refreshContentTypes).toBeCalled();
      });

    });
  });

  describe('getting the publish button label', function() {
    beforeEach(function() {
      stubs.isPublished = sinon.stub(scope.contentType, 'isPublished');
    });

    it('not published yet', function() {
      stubs.isPublished.returns(false);
      expect(scope.publishButtonLabel()).toBe('Activate');
    });

    it('already published', function() {
      stubs.isPublished.returns(true);
      expect(scope.publishButtonLabel()).toBe('Update');
    });
  });

});
