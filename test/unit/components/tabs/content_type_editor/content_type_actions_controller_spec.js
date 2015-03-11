'use strict';

describe('ContentType Actions Controller', function () {
  var controller, scope, stubs, action, $q, logger, notification;
  var space, contentType;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([ 'track', 'updatePublishedContentType' ]);

      $provide.value('analytics', {
        track: stubs.track
      });

    });
    inject(function ($controller, $rootScope, cfStub, $injector) {
      $q           = $injector.get('$q');
      logger       = $injector.get('logger');
      notification = $injector.get('notification');
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
      controller = $controller('ContentTypeActionsController', {$scope: scope});
    });
  });

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
        sinon.assert.called(stubs.action);
      });


      it('shows error notification', function() {
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve({contentType: true});
        scope.delete();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('broadcasts event', function() {
        sinon.assert.calledWith(scope.broadcastFromSpace, 'entityDeleted');
      });

      it('removes content type', function() {
        sinon.assert.calledWith(stubs.removeContentType, contentType);
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
        sinon.assert.called(stubs.action);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.warn);
      });

      it('captures server error', function() {
        sinon.assert.called(notification.warn);
        sinon.assert.called(logger.logServerWarn);
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
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('tracks analytics event', function() {
        sinon.assert.called(stubs.track);
      });

      it('updated published content type', function() {
        sinon.assert.called(stubs.updatePublishedContentType);
      });

      it('unregisters published content type', function() {
        sinon.assert.called(stubs.unregisterPublishedContentType);
      });

      it('refreshes content types', function() {
        sinon.assert.called(stubs.refreshContentTypes);
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
        scope.publish();
        scope.$apply();
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
        scope.publish();
        scope.$apply();
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
        expect(notification.error.args[0][0]).toMatch(/remote/i);
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
        sinon.assert.called(scope.validate);
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('tracks analytics event', function() {
        sinon.assert.called(stubs.track);
      });

      it('updated published content type', function() {
        sinon.assert.called(stubs.updatePublishedContentType);
      });

      it('registers published content type', function() {
        sinon.assert.called(stubs.registerPublishedContentType);
      });

      it('refreshes content types', function() {
        sinon.assert.called(stubs.refreshContentTypes);
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
