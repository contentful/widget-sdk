'use strict';

describe('Entry Actions Controller', function () {
  var controller, scope, stubs, action;
  var space, entry;
  var notification, logger;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'entryEditor', 'otUpdateEntity', 'getAt'
      ]);
    });
    inject(function ($controller, $rootScope, cfStub, $q, $injector) {
      notification = $injector.get('notification');
      logger = $injector.get('logger');

      space = cfStub.space('spaceid');
      var contentTypeData = cfStub.contentTypeData('type1');
      entry = cfStub.entry(space, 'entryid', 'typeid', {field1: 'one'}, {sys: {version: 1}});
      action = $q.defer();

      scope = $rootScope.$new();
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      scope.entry = entry;
      scope.broadcastFromSpace = sinon.stub();
      controller = $controller('EntryActionsController', {$scope: scope});
    });
  });

  describe('when deleting', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(entry, 'delete').returns(action.promise);
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
        action.resolve({entry: true});
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
    });
  });

  describe('when duplicating', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(scope.spaceContext.space, 'createEntry').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({error: true});
        scope.duplicate();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.calledWith(stubs.action, 'typeid');
      });

      it('shows error notification', function() {
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        action.resolve(entry);
        scope.navigator = {
          entryEditor: stubs.entryEditor
        };
        stubs.entryEditor.returns({goTo: sinon.stub()});
        scope.duplicate();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.calledWith(stubs.action, 'typeid');
      });

      it('calls entryEditor', function() {
        sinon.assert.calledWith(stubs.entryEditor, entry);
      });
    });
  });

  describe('when archiving', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(entry, 'archive').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        scope.archive();
        scope.$apply();
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
        action.resolve({entry: true});
        scope.archive();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });
    });
  });

  describe('when unarchiving', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(entry, 'unarchive').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        scope.unarchive();
        scope.$apply();
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
        action.resolve({entry: true});
        scope.unarchive();
        scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(stubs.action);
      });

      it('shows notification', function() {
        sinon.assert.called(notification.info);
      });
    });
  });

  describe('when unpublishing', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(entry, 'unpublish').returns(action.promise);
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        action.reject({body: {sys: {}}});
        scope.unpublish();
        scope.$apply();
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
        action.resolve({entry: true});
        scope.otUpdateEntity = stubs.otUpdateEntity;
        scope.unpublish();
        scope.$apply();
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

  describe('reverting', function () {
    var $q,
        setStub;

    beforeEach(function () {
      var entry = scope.entry;

      $q = this.$inject('$q');

      scope.otEditable = true;
      scope.otGetEntity = sinon.stub().returns(scope.entry);
      entry.save = function () { entry.data.sys.version += 1; };
      entry.publish = function () {
        entry.data.sys.publishedVersion += 1;
        entry.save();
        return $q.when();
      };
      entry.setPublishedVersion = function (version) {
        entry.data.sys.publishedVersion = version;
      };
      scope.otDoc = {
        at: sinon.stub().returns({
          set: setStub = sinon.stub()
        })
      };
      scope.$apply();
      scope.otUpdateEntity = entry.save;
      scope.validate = sinon.stub().returns(true);
    });

    // Does a bunch of reverts in the same test
    // because breakability here can be more easily
    // detected if we *don't* start with a clean slate
    // for each action.
    it('changes revertable state', function () {
      var entry = scope.entry,
          publishedData;

      expect(entry.isPublished()).toBeFalsy();
      expect(scope.canRevertToPublishedState()).toBeFalsy();
      expect(scope.canRevertToPreviousState()).toBeFalsy();

      entry.data.fields.field1 = 'two';
      entry.save();
      scope.$apply();

      expect(scope.canRevertToPublishedState()).toBeFalsy();
      expect(scope.canRevertToPreviousState()).toBeTruthy();

      scope.revertToPreviousState();
      entry.data.fields = setStub.args[0][0];
      setStub.yield();

      expect(entry.data.fields.field1).toBe('one');
      expect(scope.canRevertToPublishedState()).toBeFalsy();
      expect(scope.canRevertToPreviousState()).toBeFalsy();

      entry.data.fields.field1 = 'three';
      entry.save();
      publishedData = _.cloneDeep(entry.data);
      scope.publish();
      scope.$apply();

      expect(scope.canRevertToPublishedState()).toBeFalsy();
      expect(scope.canRevertToPreviousState()).toBeTruthy();

      entry.data.fields.field1 = 'four';
      entry.save();
      scope.$apply();

      expect(scope.canRevertToPublishedState()).toBeTruthy();
      expect(scope.canRevertToPreviousState()).toBeTruthy();

      entry.getPublishedState = sinon.stub().returns($q.when(publishedData));
      scope.revertToPublishedState();
      scope.$apply();
      entry.data.fields = setStub.args[1][0];
      setStub.yield();

      expect(entry.data.fields.field1).toBe('three');
      expect(scope.canRevertToPublishedState()).toBeFalsy();
      expect(scope.canRevertToPreviousState()).toBeTruthy();
    });
  });

  describe('when publishing', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(entry, 'publish').returns(action.promise);
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

    describe('fails with an invalid entry error (Validation error)', function() {
      var errors;
      beforeEach(function() {
        errors = {errors: true};
        action.reject({
          body: {
            message: 'Validation error',
            sys: {
              id: 'InvalidEntry'
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

      it('sets validation errors', function() {
        sinon.assert.calledWith(scope.setValidationErrors, errors);
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
        expect(logger.logServerWarn.args[0][1].error).toEqual(err);
      });
    });

    describe('succeeds', function() {
      var versionStub;
      beforeEach(function() {
        action.resolve({entry: true});
        scope.validate.returns(true);
        scope.otUpdateEntity = stubs.otUpdateEntity;
        versionStub = sinon.stub(entry, 'setPublishedVersion');
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

      it('updates ot entity', function() {
        sinon.assert.calledWith(versionStub, 1);
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
