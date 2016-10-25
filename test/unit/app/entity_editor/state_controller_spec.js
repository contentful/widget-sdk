'use strict';

describe('entityEditor/StateController', function () {
  beforeEach(function () {
    const closeStateSpy = this.closeStateSpy = sinon.spy();

    module('contentful/test', function ($provide) {
      $provide.value('navigation/closeState', closeStateSpy);
    });

    const cfStub = this.$inject('cfStub');
    const space = cfStub.space('spaceid');
    const entry = cfStub.entry(space, 'entryid', 'typeid');


    this.rootScope = this.$inject('$rootScope');
    this.scope = this.rootScope.$new();
    this.scope.entry = entry;

    this.$inject('accessChecker').canPerformActionOnEntity = sinon.stub().returns(true);

    const warnings = this.$inject('entityEditor/publicationWarnings');
    warnings.create = sinon.stub().returns({
      register: this.registerWarningSpy = sinon.spy(),
      show: this.showWarningsStub = sinon.stub().resolves()
    });

    this.entity = entry;
    this.notify = {};

    const $controller = this.$inject('$controller');
    this.controller = $controller('entityEditor/StateController', {
      $scope: this.scope,
      notify: this.notify,
      entity: entry,
      handlePublishError: null
    });
  });

  describe('#delete command execution', function () {
    beforeEach(function () {
      this.notify.deleteFail = sinon.stub();
      this.notify.deleteSuccess = sinon.stub();
      this.scope.closeState = sinon.stub();
    });

    it('calls entity.delete()', function () {
      this.entity.delete = sinon.stub().resolves();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.entity.delete);
    });

    it('send success notification', function () {
      this.entity.delete = sinon.stub().resolves();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.notify.deleteSuccess);
    });

    it('closes the current state', function () {
      this.entity.delete = sinon.stub().resolves();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.closeStateSpy);
    });

    it('sends failure notification with API error', function () {
      this.entity.delete = sinon.stub().rejects();
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnce(this.notify.deleteFail);
    });

  });

  describe('in published state without changes', function () {
    beforeEach(function () {
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

      it('unpublishes and archives the entity', function () {
        this.entity.unpublish = sinon.stub().resolves();
        this.entity.archive = sinon.stub().resolves();
        this.action.execute();
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

      it('unpublishes the entity', function () {
        this.entity.unpublish = sinon.stub().resolves();
        this.action.execute();
        this.$apply();
        sinon.assert.calledOnce(this.entity.unpublish);
      });
    });
  });

  describe('in draft state', function () {
    beforeEach(function () {
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

      it('publishes entity', function () {
        this.entity.publish = sinon.stub().resolves();
        this.controller.primary.execute();
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

      it('does not publish if validation failed', function () {
        this.entity.publish = sinon.stub().resolves();
        this.scope.validate = sinon.stub().returns(false);
        this.notify.publishValidationFail = sinon.stub();

        this.controller.primary.execute();
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
    beforeEach(function () {
      this.entity.data.fields = {field1: 'one'};
      const Document = this.$inject('mocks/entityEditor/Document');

      this.otDoc = Document.create(this.entity.data);
      this.otDoc.state.editable = true;
      this.scope.otDoc = this.otDoc;
      this.$apply();
    });

    it('cannot be reverted to previous state initially', function () {
      expect(this.controller.revertToPrevious.isAvailable()).toBe(false);
    });

    describe('with changes', function () {
      beforeEach(function () {
        this.entity.data.sys.version++;
        this.otDoc.setValueAt(['fields', 'field1'], 'changed');
        this.$apply();
      });

      it('can be reverted to previous state', function () {
        expect(this.controller.revertToPrevious.isAvailable()).toBe(true);
      });

      describe('#revertToPrevious command', function () {

        it('reverts the field data', function () {
          expect(this.otDoc.getValueAt(['fields', 'field1'])).toBe('changed');
          this.controller.revertToPrevious.execute();
          this.$apply();
          expect(this.otDoc.getValueAt(['fields', 'field1'])).toBe('one');
        });

        it('cannot be reverted to previous state afterwards', function () {
          this.controller.revertToPrevious.execute();
          this.$apply();
          expect(this.controller.revertToPrevious.isAvailable()).toBe(false);
        });
      });
    });
  });

  describe('publication warnings', function () {
    it('allows publication warnings registration', function () {
      const warning = {};
      this.controller.registerPublicationWarning(warning);
      sinon.assert.calledOnce(this.registerWarningSpy.withArgs(warning));
    });

    it('shows publication warnings before actual action', function () {
      this.entity.data.sys.publishedVersion = null;
      this.$apply();
      this.controller.primary.execute();
      sinon.assert.calledOnce(this.showWarningsStub);
    });
  });
});
