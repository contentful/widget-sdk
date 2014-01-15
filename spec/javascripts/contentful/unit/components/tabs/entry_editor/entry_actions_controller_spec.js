'use strict';

describe('Entry Actions Controller', function () {
  var controller, scope, stubs;
  var space, entry;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'serverError', 'warn', 'info', 'entryEditor', 'otUpdateEntity', 'getAt'
      ]);
      $provide.value('notification', {
        serverError: stubs.serverError,
        info: stubs.info,
        warn: stubs.warn
      });
    });
    inject(function ($controller, $rootScope, cfStub) {
      space = cfStub.space('spaceid');
      var contentTypeData = cfStub.contentTypeData('type1');
      entry = cfStub.entry(space, 'entryid', 'typeid', {}, {sys: {version: 1}});

      scope = $rootScope.$new();
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      scope.entry = entry;
      scope.broadcastFromSpace = sinon.stub();
      controller = $controller('EntryActionsCtrl', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('when deleting', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(entry, 'delete');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        stubs.action.callsArgWith(0, {error: true});
        scope['delete']();
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
        stubs.action.callsArgWith(0, null, {entry: true});
        scope['delete']();
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

  describe('when duplicating', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(scope.spaceContext.space, 'createEntry');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        stubs.action.callsArgWith(2, {error: true});
        scope.duplicate();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalledWith('typeid');
      });

      it('shows error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        stubs.action.callsArgWith(2, null, entry);
        scope.navigator = {
          entryEditor: stubs.entryEditor
        };
        stubs.entryEditor.returns({goTo: sinon.stub()});
        scope.duplicate();
      });

      it('calls action', function() {
        expect(stubs.action).toBeCalledWith('typeid');
      });

      it('calls entryEditor', function() {
        expect(stubs.entryEditor).toBeCalledWith(entry);
      });
    });
  });

  describe('when archiving', function() {
    beforeEach(function() {
      stubs.action = sinon.stub(entry, 'archive');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        stubs.action.callsArgWith(0, {body: {sys: {}}});
        scope.archive();
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
        stubs.action.callsArgWith(0, null, {entry: true});
        scope.archive();
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
      stubs.action = sinon.stub(entry, 'unarchive');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        stubs.action.callsArgWith(0, {body: {sys: {}}});
        scope.unarchive();
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
        stubs.action.callsArgWith(0, null, {entry: true});
        scope.unarchive();
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
      stubs.action = sinon.stub(entry, 'unpublish');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        stubs.action.callsArgWith(0, {body: {sys: {}}});
        scope.unpublish();
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
        stubs.action.callsArgWith(0, null, {entry: true});
        scope.otUpdateEntity = stubs.otUpdateEntity;
        scope.unpublish();
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
      stubs.action = sinon.stub(entry, 'publish');
      scope.validate = sinon.stub();
    });

    describe('fails due to validation', function() {
      beforeEach(function() {
        stubs.action.callsArgWith(1, {body: {sys: {}}});
        scope.validate.returns(false);
        scope.publish();
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
        stubs.action.callsArgWith(1, {
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
        expect(stubs.serverError).toBeCalled();
      });
    });

    describe('fails with a version mismatch', function() {
      var errors;
      beforeEach(function() {
        errors = {errors: true};
        stubs.action.callsArgWith(1, {
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
        expect(stubs.serverError.args[0][0]).toMatch(/version/i);
      });
    });

    describe('fails with a remote error', function() {
      var errors;
      beforeEach(function() {
        errors = {errors: true};
        stubs.action.callsArgWith(1, {
          body: {
            sys: {
              id: 'remote error'
            },
          }
        });
        scope.validate.returns(true);
        scope.publish();
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
        stubs.action.callsArgWith(1, null, {entry: true});
        scope.validate.returns(true);
        scope.otUpdateEntity = stubs.otUpdateEntity;
        versionStub = sinon.stub(entry, 'setPublishedVersion');
        scope.publish();
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
