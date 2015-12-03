'use strict';

describe('entityEditor/StateController', function () {
  beforeEach(function () {
    module('contentful/test');
    var cfStub = this.$inject('cfStub');


    var space = cfStub.space('spaceid');
    var entry = cfStub.entry(space, 'entryid', 'typeid');


    var $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    this.scope.entry = entry;
    this.scope.permissionController = {
      canPerformActionOnEntity: sinon.stub().returns(true)
    };

    this.entity = entry;
    this.notify = {};

    var $controller = this.$inject('$controller');
    this.controller = $controller('entityEditor/StateController', {
      $scope: this.scope,
      notify: this.notify,
      entity: entry,
      handlePublishError: null,
    });

    this.broadcastStub = sinon.stub($rootScope, '$broadcast');
  });

  describe('#delete command execution', function() {
    beforeEach(function() {
      this.notify.deleteFail = sinon.stub();
      this.notify.deleteSuccess = sinon.stub();
      this.scope.closeState = sinon.stub();
    });

    it('calls entity.delete()', function() {
      this.entity.delete = sinon.stub().resolves();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.entity.delete);
    });

    it('send success notification', function() {
      this.entity.delete = sinon.stub().resolves();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.scope.closeState);
    });

    it('closes the current state', function() {
      this.entity.delete = sinon.stub().resolves();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.notify.deleteSuccess);
    });

    it('sends failure notification with API error', function () {
      this.entity.delete = sinon.stub().rejects();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.notify.deleteFail);
    });

  });

  describe('in published state without changes', function () {
    beforeEach(function() {
      this.entity.data.sys.publishedVersion = 42;
      this.entity.data.sys.version = 43;
      this.entity.data.sys.archivedVersion = null;
      this.$apply();
    });

    it('sets current state to "published"', function () {
      expect(this.controller.current).toEqual('published');
    });

    it('has no primary action', function () {
      expect(this.controller.hidePrimary).toBe(true);
    });

    it('has two secondary actions', function () {
      expect(this.controller.secondary.length).toEqual(2);
    });

    describe('the first secondary action', function () {
      beforeEach(function () {
        this.action = this.controller.secondary[0];
      });

      it('unpublishes and archives the entity', function (done) {
        this.entity.unpublish = sinon.stub().resolves();
        this.entity.archive = sinon.stub().resolves();
        this.action.execute().finally(done);
        this.$apply();
        sinon.assert.callOrder(
          this.entity.unpublish,
          this.entity.archive
        );
      });
    });

    describe('the second secondary action', function () {
      beforeEach(function () {
        this.action = this.controller.secondary[1];
      });

      it('unpublishes the entity', function (done) {
        this.entity.unpublish = sinon.stub().resolves();
        this.action.execute().finally(done);
        this.$apply();
        sinon.assert.calledOnce(this.entity.unpublish);
      });
    });
  });

  describe('in draft state', function () {
    beforeEach(function() {
      this.entity.data.sys.version = 1;
      this.entity.data.sys.publishedVersion = null;
      this.entity.data.sys.archivedVersion = null;
      this.scope.validate = sinon.stub().returns(true);
      this.$apply();
    });

    it('sets current state to "draft"', function () {
      expect(this.controller.current).toEqual('draft');
    });

    describe('primary action', function () {

      it('publishes entity', function (done) {
        this.entity.publish = sinon.stub().resolves();
        this.controller.primary.execute().finally(done);
        this.$apply();
        sinon.assert.calledOnce(this.entity.publish);
      });

      it('calls scope.validate()', function () {
        this.entity.publish = sinon.stub().resolves();
        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledOnce(this.scope.validate);
      });

      it('sends notification if validation failed', function () {
        this.scope.validate = sinon.stub().returns(false);
        this.notify.publishValidationFail = sinon.stub();

        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledOnce(this.notify.publishValidationFail);
      });

      it('does not publish if validation failed', function (done) {
        this.entity.publish = sinon.stub().resolves();
        this.scope.validate = sinon.stub().returns(false);
        this.notify.publishValidationFail = sinon.stub();

        this.controller.primary.execute().finally(done);
        this.$apply();
        sinon.assert.notCalled(this.entity.publish);
      });

    });

    describe('secondary actions', function () {
      beforeEach(function () {
        this.action = this.controller.secondary[0];
      });

      it('has only one', function () {
        expect(this.controller.secondary.length).toEqual(1);
      });


      it('archives entity', function () {
        this.entity.archive = sinon.stub().resolves();
        this.action.execute();
        this.$apply();
        sinon.assert.calledOnce(this.entity.archive);
      });

    });

  });

  describe('reverting', function () {
    var entry;

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
      var $q = this.$inject('$q');
      entry = this.scope.entry;
      entry.publish = function () {
        entry.data.sys.publishedVersion = entry.data.sys.version;
        entry.data.sys.version += 1;
        return $q.when();
      };

      this.entity.data.fields = {field1: 'one'};

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
        this.controller.primary.execute();
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

});
