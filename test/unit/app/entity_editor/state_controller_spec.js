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
    this.scope.editorContext = this.$inject('mocks/entityEditor/Context').create();
    this.scope.entry = entry;

    this.$inject('accessChecker').canPerformActionOnEntity = sinon.stub().returns(true);

    const warnings = this.$inject('entityEditor/publicationWarnings');
    warnings.create = sinon.stub().returns({
      register: this.registerWarningSpy = sinon.spy(),
      show: this.showWarningsStub = sinon.stub().resolves()
    });

    this.entity = entry;
    this.notify = {};

    const Document = this.$inject('mocks/entityEditor/Document');
    this.doc = Document.create();

    const $controller = this.$inject('$controller');
    this.controller = $controller('entityEditor/StateController', {
      $scope: this.scope,
      notify: this.notify,
      entity: entry,
      handlePublishError: null,
      otDoc: this.doc
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
      this.$apply();
    });

    it('sets current state to "draft"', function () {
      expect(this.controller.current).toEqual('draft');
    });

    describe('primary action', function () {
      beforeEach(function () {
        this.validator = this.scope.editorContext.validator;
        this.notify.publishValidationFail = sinon.stub();
      });

      it('publishes entity', function () {
        this.entity.publish = sinon.stub().resolves();
        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledOnce(this.entity.publish);
      });

      it('calls runs validator', function () {
        this.entity.publish = sinon.stub().resolves();
        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledOnce(this.validator.run);
      });

      it('sends notification if validation failed', function () {
        this.validator.run.returns(false);
        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledOnce(this.notify.publishValidationFail);
      });

      it('does not publish if validation failed', function () {
        this.entity.publish = sinon.stub().resolves();
        this.validator.run.returns(false);
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

  describe('#revertToPrevious command', function () {
    it('is available iff document has changes', function () {
      this.doc.reverter.hasChanges.returns(true);
      expect(this.controller.revertToPrevious.isAvailable()).toBe(true);
      this.doc.reverter.hasChanges.returns(false);
      expect(this.controller.revertToPrevious.isAvailable()).toBe(false);
    });

    it('calls notification for successful execution', function () {
      this.doc.reverter.revert.resolves();
      this.notify.revertToPreviousSuccess = sinon.spy();

      sinon.assert.notCalled(this.doc.reverter.revert);
      this.controller.revertToPrevious.execute();
      this.$apply();

      sinon.assert.calledOnce(this.doc.reverter.revert);
      sinon.assert.calledOnce(this.notify.revertToPreviousSuccess);
    });

    it('calls notification for failed execution', function () {
      this.doc.reverter.revert.rejects();
      this.notify.revertToPreviousFail = sinon.spy();

      sinon.assert.notCalled(this.doc.reverter.revert);
      this.controller.revertToPrevious.execute();
      this.$apply();

      sinon.assert.calledOnce(this.doc.reverter.revert);
      sinon.assert.calledOnce(this.notify.revertToPreviousFail);
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
