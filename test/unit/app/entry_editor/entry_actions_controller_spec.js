'use strict';

describe('Entry Actions Controller', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$q = this.$inject('$q');
    this.notification = this.$inject('notification');
    this.logger = this.$inject('logger');
    var $rootScope = this.$inject('$rootScope');
    var cfStub = this.$inject('cfStub');

    var space = cfStub.space('spaceid');
    var contentTypeData = cfStub.contentTypeData('type1');
    var entry = cfStub.entry(space, 'entryid', 'typeid', {field1: 'one'}, {sys: {version: 1}});

    this.scope = $rootScope.$new();
    this.scope.otDoc = {doc: {}, state: {}};
    this.scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
    this.scope.entry = entry;
    this.broadcastStub = sinon.stub($rootScope, '$broadcast');
    this.controller = this.$inject('$controller')('EntryActionsController', {$scope: this.scope});
  });

  afterEach(function () {
    this.broadcastStub.restore();
  });

  describe('#delete command', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'delete');
    });

    describe('with API error', function() {
      beforeEach(function() {
        this.actionStub.rejects({error: true});
        this.controller.delete.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.error);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('with API success', function() {
      beforeEach(function() {
        this.actionStub.resolves({entry: true});
        this.controller.delete.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(this.notification.info);
      });

      it('broadcasts event', function() {
        sinon.assert.calledWith(this.broadcastStub, 'entityDeleted');
      });
    });
  });

  describe('scope.duplicate()', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.spaceContext.space, 'createEntry');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.rejects({error: true});
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.calledWith(this.actionStub, 'typeid');
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.error);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionStub.resolves(this.scope.entry);
        this.scope.$state.go = sinon.stub();
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.calledWith(this.actionStub, 'typeid');
      });

      it('opens the editor', function() {
        sinon.assert.calledWith(this.scope.$state.go, 'spaces.detail.entries.detail', {
          entryId: this.scope.entry.getId(),
          addToContext: true
        });
      });
    });
  });

  describe('#archive command', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'archive');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.rejects({body: {sys: {}}});
        this.controller.archive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.error);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionStub.resolves({entry: true});
        this.controller.archive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(this.notification.info);
      });
    });
  });

  describe('#unarchive command', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'unarchive');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.rejects({body: {sys: {}}});
        this.controller.unarchive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.error);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionStub.resolves({entry: true});
        this.controller.unarchive.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(this.notification.info);
      });
    });
  });

  describe('#unpublish command', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'unpublish');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.rejects({body: {sys: {}}});
        this.controller.unpublish.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.error);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionStub.resolves({entry: true});
        this.scope.otDoc.updateEntityData = sinon.stub();
        this.controller.unpublish.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(this.notification.info);
      });

      it('updates ot entity', function() {
        sinon.assert.called(this.scope.otDoc.updateEntityData);
      });
    });
  });

  describe('reverting', function () {
    var self, entry;

    function canBeReverted(states) {
      if(states.toPublished) {
        it('entry can be reverted to published', function() {
          expect(this.controller.revertToPublished.isAvailable()).toBeTruthy();
        });
      } else {
        it('entry cannot be reverted to published', function() {
          expect(this.controller.revertToPublished.isAvailable()).toBeFalsy();
        });
      }

      if(states.toPrevious) {
        it('entry can be reverted to previous state', function() {
          expect(this.controller.revertToPrevious.isAvailable()).toBeTruthy();
        });
      } else {
        it('entry cannot be reverted to previous state', function() {
          expect(this.controller.revertToPrevious.isAvailable()).toBeFalsy();
        });
      }
    }

    /**
     * Mock object providing the interface from the `ot-doc-for`
     * directive.
     */
    function OtDoc (entity) {
      var doc = this.doc = {
        at: createSubDoc
      };

      this.state = {
        editable: true
      };

      this.updateEntityData = function () {
        entity.data = this.doc.snapshot;
        entity.data.sys.version += 1;
      };

      this.getEntity = function () {
        return entity;
      };

      this.updateSnapshot = function () {
        doc.snapshot = _.cloneDeep(entity.data);
      };

      this.updateSnapshot();

      function createSubDoc (path) {
        return { set: set };

        function set (data, cb) {
          dotty.put(doc.snapshot, path, data);
          if (cb) {
            cb();
          }
        }
      }
    }

    beforeEach(function () {
      self = this;
      entry = this.scope.entry;
      entry.publish = function () {
        entry.data.sys.publishedVersion = entry.data.sys.version;
        entry.data.sys.version += 1;
        return self.$q.when();
      };

      this.scope.entityActionsController = {
        canUpdate: sinon.stub().returns(true)
      };

      this.otDoc = new OtDoc(entry);
      this.scope.otDoc = this.otDoc;
      this.scope.validate = sinon.stub().returns(true);
      this.$apply();
    });

    describe('in initial, unpublished state', function () {
      canBeReverted({toPublished: false, toPrevious: false});
    });

    describe('published entry with changes', function () {
      beforeEach(function() {
        this.controller.publish.execute();
        this.$apply();
        // TODO we should not need this
        this.otDoc.updateSnapshot();

        this.otDoc.doc.at('fields.field1').set('two');
        this.otDoc.updateEntityData();
        this.$apply();
      });

      canBeReverted({toPublished: true, toPrevious: true});

      describe('#revertToPublished command', function () {
        beforeEach(function() {
          entry.getPublishedState = sinon.stub().resolves({fields: 'published'});
          this.controller.revertToPublished.execute();
          this.$apply();
        });

        it('reverts the field data', function() {
          expect(entry.data.fields).toBe('published');
        });

        describe('afterwards', function () {
          beforeEach(function () {
            this.controller.revertToPublished.execute();
            this.$apply();
          });

          canBeReverted({toPublished: false, toPrevious: false});
        });
      });
    });


    describe('unpublished entry with changes', function () {
      beforeEach(function() {
        this.otDoc.doc.at('fields.field1').set('two');
        this.otDoc.updateEntityData();
        this.$apply();
      });

      canBeReverted({toPublished: false, toPrevious: true});

      describe('#revertToPrevious command', function() {

        it('reverts the field data', function() {
          expect(entry.data.fields.field1).toBe('two');
          expect(this.otDoc.doc.snapshot.fields.field1).toBe('two');
          this.controller.revertToPrevious.execute();
          this.$apply();
          expect(entry.data.fields.field1).toBe('one');
          expect(this.otDoc.doc.snapshot.fields.field1).toBe('one');
        });

        it('increments version', function () {
          expect(entry.data.sys.version).toEqual(2);
          this.controller.revertToPrevious.execute();
          this.$apply();
          expect(entry.data.sys.version).toEqual(3);
        });

        describe('afterwards', function () {
          beforeEach(function () {
            this.controller.revertToPrevious.execute();
            this.$apply();
          });

          canBeReverted({toPublished: false, toPrevious: false});
        });
      });
    });

  });

  describe('#publish command', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'publish');
      this.scope.validate = sinon.stub();
    });

    describe('fails due to validation', function() {
      beforeEach(function() {
        this.actionStub.rejects({body: {sys: {}}});
        this.scope.validate.returns(false);
        this.controller.publish.execute();
        this.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(this.scope.validate);
      });

      it('shows warn notification', function() {
        sinon.assert.called(this.notification.error);
      });
    });

    describe('with server error: ', function() {
      beforeEach(function() {
        this.scope.validate.returns(true);
        this.scope.setValidationErrors = sinon.stub();
      });

      function buildErrorResponse (id, message, errors) {
        return {
          body: {
            sys: {id: id},
            message: message || '',
            details: {errors: errors || []}
          }
        };
      }

      describe('ValidationFailed', function() {
        beforeEach(function() {
          this.actionStub.rejects(buildErrorResponse('ValidationFailed'));
          this.controller.publish.execute();
          this.$apply();
        });

        it('calls validation', function() {
          sinon.assert.called(this.scope.validate);
        });

        it('sets validation errors', function() {
          sinon.assert.calledWith(this.scope.setValidationErrors, []);
        });

        it('calls action', function() {
          sinon.assert.called(this.actionStub);
        });

        it('shows error notification', function() {
          sinon.assert.called(this.notification.error);
        });
      });

      describe('UnresolvedLinks', function() {
        beforeEach(function() {
          this.actionStub.rejects(buildErrorResponse('UnresolvedLinks'));
          this.controller.publish.execute();
          this.$apply();
        });

        it('calls validation', function() {
          sinon.assert.called(this.scope.validate);
        });

        it('calls action', function() {
          sinon.assert.called(this.actionStub);
        });

        it('shows error notification', function() {
          sinon.assert.called(this.notification.error);
        });

        it('gets contextual error message', function() {
          expect(this.notification.error.args[0][0]).toMatch(/linked entries/i);
        });
      });

      describe('fails with a version mismatch', function() {
        beforeEach(function() {
          this.actionStub.rejects(buildErrorResponse('VersionMismatch'));
          this.controller.publish.execute();
          this.$apply();
        });

        it('calls validation', function() {
          sinon.assert.called(this.scope.validate);
        });

        it('calls action', function() {
          sinon.assert.called(this.actionStub);
        });

        it('shows error notification', function() {
          sinon.assert.called(this.notification.error);
        });

        it('gets contextual error message', function() {
          expect(this.notification.error.args[0][0]).toMatch(/version/i);
        });
      });

      describe('fails with an invalid entry error (Link validation error)', function() {
        var errors;
        beforeEach(function() {
          errors = [{name: 'linkContentType'}];
          this.actionStub.rejects(buildErrorResponse(
            'InvalidEntry', 'Validation error', errors
          ));
          this.controller.publish.execute();
          this.$apply();
        });

        it('sets validation errors', function() {
          sinon.assert.calledWith(this.scope.setValidationErrors, errors);
        });

        it('gets contextual error message', function() {
          expect(this.notification.error.args[0][0]).toMatch(/unexistent content type/i);
        });
      });

      describe('fails with an invalid entry error (Link validation error with a given content type)', function() {
        var errors;
        beforeEach(function() {
          this.scope.spaceContext.publishedContentTypes = [
            {data: {sys: {id: 'contentTypeId'}, name: 'content type name'}}
          ];
          errors = [{
            name: 'linkContentType',
            details: 'error details contentTypeId',
            contentTypeId: ['contentTypeId']
          }];
          this.actionStub.rejects(buildErrorResponse(
            'InvalidEntry', 'Validation error', errors
          ));
          this.controller.publish.execute();
          this.$apply();
        });

        it('sets validation errors', function() {
          sinon.assert.calledWith(this.scope.setValidationErrors, errors);
        });

        it('gets contextual error message', function() {
          expect(this.notification.error.args[0][0]).toMatch(/content type name/i);
        });
      });

      describe('fails with an invalid entry error (Validation error)', function() {
        beforeEach(function() {
          this.actionStub.rejects(buildErrorResponse(
            'InvalidEntry', 'Validation error', 'AN ERROR'
          ));
          this.controller.publish.execute();
          this.$apply();
        });

        it('sets validation errors', function() {
          sinon.assert.calledWith(this.scope.setValidationErrors, 'AN ERROR');
        });

        it('gets contextual error message', function() {
          expect(this.notification.error.args[0][0]).toMatch(/individual fields/i);
        });
      });

      describe('fails with a remote error', function() {
        beforeEach(function() {
          this.errorResponse = buildErrorResponse('remote error');
          this.actionStub.rejects(this.errorResponse);
          this.controller.publish.execute();
          this.$apply();
        });

        it('calls validation', function() {
          sinon.assert.called(this.scope.validate);
        });

        it('calls action', function() {
          sinon.assert.called(this.actionStub);
        });

        it('shows error notification', function() {
          sinon.assert.called(this.notification.error);
          sinon.assert.called(this.logger.logServerWarn);
        });

        it('gets contextual error message', function() {
          expect(this.logger.logServerWarn.args[0][1].error).toEqual(this.errorResponse);
        });
      });

      describe('succeeds', function() {
        beforeEach(function() {
          this.actionStub.resolves({entry: true});
          this.scope.otDoc.updateEntityData = sinon.stub();
          this.controller.publish.execute();
          this.$apply();
        });

        it('calls validation', function() {
          sinon.assert.called(this.scope.validate);
        });

        it('calls action', function() {
          sinon.assert.called(this.actionStub);
        });

        it('shows notification', function() {
          sinon.assert.called(this.notification.info);
        });
      });

    });
  });
});
