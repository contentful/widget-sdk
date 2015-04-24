'use strict';

describe('ContentType Actions Controller', function () {
  var controller, scope, stubs, $q, logger, notification;
  var space, contentType;

  beforeEach(function () {
    this.updatePublishedContentTypeStub = sinon.stub();
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([ 'track']);

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
      this.actionDeferred = $q.defer();

      scope = $rootScope.$new();
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      scope.contentType = contentType;
      scope.broadcastFromSpace = sinon.stub();
      scope.regulateDisplayField = sinon.stub();
      controller = $controller('ContentTypeActionsController', {$scope: scope});
    });
  });

  describe('when deleting', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(contentType, 'delete').returns(this.actionDeferred.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionDeferred.reject({error: true});
        scope.delete();
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
        scope.delete();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });

      it('broadcasts event', function() {
        sinon.assert.calledWith(scope.broadcastFromSpace, 'entityDeleted');
      });
    });
  });

  describe('when unpublishing', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(contentType, 'unpublish').returns(this.actionDeferred.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionDeferred.reject({body: {message: ''}});
        scope.unpublish();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
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
        this.actionDeferred.resolve({contentType: true});
        this.unregisterPublishedContentTypeStub = sinon.stub(scope.spaceContext, 'unregisterPublishedContentType');
        scope.updatePublishedContentType = this.updatePublishedContentTypeStub;
        this.refreshContentTypesStub = sinon.stub(scope.spaceContext, 'refreshContentTypes');
        scope.unpublish();
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

  // TODO update tests to stub save before publish
  xdescribe('when publishing', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(contentType, 'publish').returns(this.actionDeferred.promise);
      scope.validate = sinon.stub();
    });

    describe('fails due to validation', function() {
      beforeEach(function() {
        this.actionDeferred.reject({body: {sys: {}}});
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
        this.actionDeferred.reject({
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
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.warn);
      });
    });

    describe('fails with a version mismatch', function() {
      var errors;
      beforeEach(function() {
        errors = {errors: true};
        this.actionDeferred.reject({
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
        sinon.assert.called(this.actionStub);
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
        this.actionDeferred.reject({
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
        sinon.assert.called(this.actionStub);
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
        this.actionDeferred.resolve({contentType: true});
        scope.validate.returns(true);
        scope.updatePublishedContentType = this.updatePublishedContentTypeStub;
        this.registerPublishedContentTypeStub = sinon.stub(scope.spaceContext, 'registerPublishedContentType');
        this.refreshContentTypesStub = sinon.stub(scope.spaceContext, 'refreshContentTypes');
        scope.publish();
        scope.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(scope.validate);
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

      it('registers published content type', function() {
        sinon.assert.called(this.registerPublishedContentTypeStub);
      });

      it('refreshes content types', function() {
        sinon.assert.called(this.refreshContentTypesStub);
      });

    });
  });
});
