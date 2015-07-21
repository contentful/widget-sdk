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
    this.scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
    this.scope.entry = entry;
    this.broadcastStub = sinon.stub($rootScope, '$broadcast');
    this.$inject('$controller')('EntryActionsController', {$scope: this.scope});
  });

  afterEach(function () {
    this.broadcastStub.restore();
  });

  describe('when deleting', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'delete');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.reject({error: true}));
        this.scope.delete();
        this.scope.$apply();
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
        this.actionStub.returns(this.$q.when({entry: true}));
        this.scope.delete();
        this.scope.$apply();
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

  describe('when duplicating', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.spaceContext.space, 'createEntry');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.reject({error: true}));
        this.scope.duplicate();
        this.scope.$apply();
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
        this.actionStub.returns(this.$q.when(this.scope.entry));
        this.scope.$state.go = sinon.stub();
        this.scope.duplicate();
        this.scope.$apply();
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

  describe('when archiving', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'archive');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.reject({body: {sys: {}}}));
        this.scope.archive();
        this.scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.warn);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.when({entry: true}));
        this.scope.archive();
        this.scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(this.notification.info);
      });
    });
  });

  describe('when unarchiving', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'unarchive');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.reject({body: {sys: {}}}));
        this.scope.unarchive();
        this.scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.warn);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.when({entry: true}));
        this.scope.unarchive();
        this.scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(this.notification.info);
      });
    });
  });

  describe('when unpublishing', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'unpublish');
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.reject({body: {sys: {}}}));
        this.scope.unpublish();
        this.scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows error notification', function() {
        sinon.assert.called(this.notification.warn);
      });

      it('logs error notification', function() {
        sinon.assert.called(this.logger.logServerWarn);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.when({entry: true}));
        this.scope.otUpdateEntity = sinon.stub();
        this.scope.unpublish();
        this.scope.$apply();
      });

      it('calls action', function() {
        sinon.assert.called(this.actionStub);
      });

      it('shows notification', function() {
        sinon.assert.called(this.notification.info);
      });

      it('updates ot entity', function() {
        sinon.assert.called(this.scope.otUpdateEntity);
      });
    });
  });

  describe('reverting', function () {
    var self, entry;

    function canBeReverted(states) {
      if(states.toPublished) {
        it('entry can be reverted to published', function() {
          expect(self.scope.canRevertToPublishedState()).toBeTruthy();
        });
      } else {
        it('entry cannot be reverted to published', function() {
          expect(self.scope.canRevertToPublishedState()).toBeFalsy();
        });
      }

      if(states.toPrevious) {
        it('entry can be reverted to previous state', function() {
          expect(this.scope.canRevertToPreviousState()).toBeTruthy();
        });
      } else {
        it('entry cannot be reverted to previous state', function() {
          expect(this.scope.canRevertToPreviousState()).toBeFalsy();
        });
      }
    }

    beforeEach(function () {
      self = this;
      entry = this.scope.entry;

      this.scope.otEditable = true;
      this.scope.otGetEntity = sinon.stub().returns(this.scope.entry);
      entry.save = function () { entry.data.sys.version += 1; };
      entry.publish = function () {
        entry.data.sys.publishedVersion += 1;
        entry.save();
        return self.$q.when();
      };
      entry.setPublishedVersion = function (version) {
        entry.data.sys.publishedVersion = version;
      };
      this.setStub = sinon.stub();
      this.scope.otDoc = {
        at: sinon.stub().returns({
          set: this.setStub
        })
      };
      this.scope.$apply();
      this.scope.otUpdateEntity = entry.save;
      this.scope.validate = sinon.stub().returns(true);
    });

    it('entry is not published', function() {
      expect(entry.isPublished()).toBeFalsy();
    });

    canBeReverted({toPublished: false, toPrevious: false});

    describe('if field changes', function() {
      beforeEach(function() {
        entry.data.fields.field1 = 'two';
        entry.save();
        this.scope.$apply();
      });

      canBeReverted({toPublished: false, toPrevious: true});

      describe('if it is reverted', function() {
        beforeEach(function() {
          this.scope.revertToPreviousState();
          entry.data.fields = this.setStub.args[0][0];
          this.setStub.yield();
        });

        it('reverts the field data', function() {
          expect(entry.data.fields.field1).toBe('one');
        });

        canBeReverted({toPublished: false, toPrevious: false});

        describe('if field changes and entry is saved', function() {
          beforeEach(function() {
            entry.data.fields.field1 = 'three';
            entry.save();
            this.publishedData = _.cloneDeep(entry.data);
            this.scope.publish();
            this.scope.$apply();
          });

          canBeReverted({toPublished: false, toPrevious: true});

          describe('changes field again and saves again', function() {
            beforeEach(function() {
              entry.data.fields.field1 = 'four';
              entry.save();
              this.scope.$apply();
            });

            canBeReverted({toPublished: true, toPrevious: true});

            describe('reverts to published state and then changes the field', function() {
              beforeEach(function() {
                entry.getPublishedState = sinon.stub().returns(this.$q.when(this.publishedData));
                this.scope.revertToPublishedState();
                this.scope.$apply();
                entry.data.fields = this.setStub.args[1][0];
                this.setStub.yield();
              });

              it('reverts the field data', function() {
                expect(entry.data.fields.field1).toBe('three');
              });

              canBeReverted({toPublished: false, toPrevious: true});
            });

          });
        });
      });
    });

  });

  describe('when publishing', function() {
    beforeEach(function() {
      this.actionStub = sinon.stub(this.scope.entry, 'publish');
      this.scope.validate = sinon.stub();
    });

    describe('fails due to validation', function() {
      beforeEach(function() {
        this.actionStub.returns(this.$q.reject({body: {sys: {}}}));
        this.scope.validate.returns(false);
        this.scope.publish();
        this.scope.$apply();
      });

      it('calls validation', function() {
        sinon.assert.called(this.scope.validate);
      });

      it('shows warn notification', function() {
        sinon.assert.called(this.notification.warn);
      });
    });

    describe('local validation passes', function() {
      beforeEach(function() {
        this.scope.validate.returns(true);
        this.scope.setValidationErrors = sinon.stub();
      });

      describe('fails with a remote validation error', function() {
        beforeEach(function() {
          this.actionStub.returns(this.$q.reject({
            body: {
              sys: {
                id: 'ValidationFailed'
              },
              details: {
                errors: []
              }
            }
          }));
          this.scope.publish();
          this.scope.$apply();
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
          sinon.assert.called(this.notification.warn);
        });
      });

      describe('fails with unresolved links', function() {
        beforeEach(function() {
          this.actionStub.returns(this.$q.reject({
            body: {
              sys: {
                id: 'UnresolvedLinks'
              },
              details: {
                errors: []
              }
            }
          }));
          this.scope.publish();
          this.scope.$apply();
        });

        it('calls validation', function() {
          sinon.assert.called(this.scope.validate);
        });

        it('calls action', function() {
          sinon.assert.called(this.actionStub);
        });

        it('shows error notification', function() {
          sinon.assert.called(this.notification.warn);
        });

        it('gets contextual error message', function() {
          expect(this.notification.warn.args[0][0]).toMatch(/linked entries/i);
        });
      });

      describe('fails with a version mismatch', function() {
        var errors;
        beforeEach(function() {
          errors = {errors: true};
          this.actionStub.returns(this.$q.reject({
            body: {
              sys: {
                id: 'VersionMismatch'
              },
              details: {
                errors: errors
              }
            }
          }));
          this.scope.publish();
          this.scope.$apply();
        });

        it('calls validation', function() {
          sinon.assert.called(this.scope.validate);
        });

        it('calls action', function() {
          sinon.assert.called(this.actionStub);
        });

        it('shows error notification', function() {
          sinon.assert.called(this.notification.warn);
        });

        it('gets contextual error message', function() {
          expect(this.notification.warn.args[0][0]).toMatch(/version/i);
        });
      });

      describe('fails with an invalid entry error (Link validation error)', function() {
        var errors;
        beforeEach(function() {
          errors = [{name: 'linkContentType'}];
          this.actionStub.returns(this.$q.reject({
            body: {
              message: 'Validation error',
              sys: {
                id: 'InvalidEntry'
              },
              details: {
                errors: errors
              }
            }
          }));
          this.scope.publish();
          this.scope.$apply();
        });

        it('sets validation errors', function() {
          sinon.assert.calledWith(this.scope.setValidationErrors, errors);
        });

        it('gets contextual error message', function() {
          expect(this.notification.warn.args[0][0]).toMatch(/unexistent content type/i);
        });
      });

      describe('fails with an invalid entry error (Link validation error with a given content type)', function() {
        var errors;
        beforeEach(function() {
          this.scope.spaceContext.publishedContentTypes = [
            {data: {sys: {id: 'contentTypeId'}, name: 'content type name'}}
          ];
          errors = [{name: 'linkContentType', details: 'error details contentTypeId', contentTypeId: ['contentTypeId']}];
          this.actionStub.returns(this.$q.reject({
            body: {
              message: 'Validation error',
              sys: {
                id: 'InvalidEntry'
              },
              details: {
                errors: errors
              }
            }
          }));
          this.scope.publish();
          this.scope.$apply();
        });

        it('sets validation errors', function() {
          sinon.assert.calledWith(this.scope.setValidationErrors, errors);
        });

        it('gets contextual error message', function() {
          expect(this.notification.warn.args[0][0]).toMatch(/content type name/i);
        });
      });

      describe('fails with an invalid entry error (Validation error)', function() {
        var errors;
        beforeEach(function() {
          errors = {errors: true};
          this.actionStub.returns(this.$q.reject({
            body: {
              message: 'Validation error',
              sys: {
                id: 'InvalidEntry'
              },
              details: {
                errors: errors
              }
            }
          }));
          this.scope.publish();
          this.scope.$apply();
        });

        it('sets validation errors', function() {
          sinon.assert.calledWith(this.scope.setValidationErrors, errors);
        });

        it('gets contextual error message', function() {
          expect(this.notification.warn.args[0][0]).toMatch(/individual fields/i);
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
          this.actionStub.returns(this.$q.reject(err));
          this.scope.publish();
          this.scope.$apply();
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
          expect(this.logger.logServerWarn.args[0][1].error).toEqual(err);
        });
      });

      describe('succeeds', function() {
        var versionStub;
        beforeEach(function() {
          this.actionStub.returns(this.$q.when({entry: true}));
          this.scope.otUpdateEntity = sinon.stub();
          versionStub = sinon.stub(this.scope.entry, 'setPublishedVersion');
          this.scope.publish();
          this.scope.$apply();
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

        it('updates ot entity', function() {
          sinon.assert.calledWith(versionStub, 1);
        });
      });

    });
  });

  describe('getting the publish button label', function() {
    beforeEach(function() {
      this.scope.otDoc = {
        getAt: sinon.stub()
      };
    });

    it('not published yet', function() {
      this.scope.otDoc.getAt.returns(false);
      expect(this.scope.publishButtonLabel()).toBe('Publish');
    });

    it('already published', function() {
      this.scope.otDoc.getAt.returns(true);
      expect(this.scope.publishButtonLabel()).toBe('Republish');
    });
  });

});
