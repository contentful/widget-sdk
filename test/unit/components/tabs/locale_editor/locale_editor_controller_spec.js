'use strict';

describe('Locale editor controller', function () {
  beforeEach(function () {
    var self = this;
    this.logger = {
      logServerWarn: sinon.stub()
    };
    this.notification = {
      info: sinon.stub(),
      warn: sinon.stub()
    };
    this.analytics = {
      track: sinon.stub()
    };
    this.modalDialog = {
      openConfirmDialog: sinon.stub()
    };
    this.TheLocaleStoreMock = {
      refreshLocales: sinon.stub()
    };

    module('contentful/test', function ($provide) {
      $provide.value('logger', self.logger);
      $provide.value('notification', self.notification);
      $provide.value('analytics', self.analytics);
      $provide.value('modalDialog', self.modalDialog);
      $provide.value('TheLocaleStore', self.TheLocaleStoreMock);
    });

    this.$q = this.$inject('$q');
    this.$inject('tokenStore').getUpdatedToken = sinon.stub().returns(this.$q.when());
    this.scope = this.$inject('$rootScope').$new();

    this.scope.spaceContext = {
      defaultLocale: {
        name: 'U.S. English',
        code: 'en-US'
      },
      refreshLocales: sinon.stub()
    };
    dotty.put(this.scope.spaceContext, 'space.data.organization.subscriptionPlan.name', 'Unlimited');

    this.scope.context = {};

    this.scope.localeForm = {
      $setPristine: sinon.stub(),
      $setDirty: sinon.stub(),
      $setSubmitted: sinon.stub()
    };

    var getIdStub = sinon.stub();
    this.scope.locale = {
      data: {},
      getName: sinon.stub().returns('localeName'),
      getId: getIdStub.returns('someId'),
      delete: sinon.stub().returns(this.$q.when()),
      save: sinon.stub().returns(this.$q.when({getId: getIdStub})),
      getCode: sinon.stub(),
      isDefault: sinon.stub(),
      getVersion: sinon.stub()
    };

    var $controller = this.$inject('$controller');
    this.controller = $controller('LocaleEditorController', {$scope: this.scope});
    this.$apply();
  });

  it('sets a locale on the scope', function () {
    expect(this.scope.locale).toBeDefined();
  });

  it('sets the state title', function () {
    this.scope.locale.getName.returns('Some name');
    this.scope.$digest();
    expect(this.scope.context.title).toEqual('Some name');
  });

  it('sets the dirty param on the tab', function () {
    this.scope.localeForm.$dirty = true;
    this.scope.$apply();
    expect(this.scope.context.dirty).toBeTruthy();
  });

  describe('#delete command succeeds', function () {
    beforeEach(function() {
      this.scope.locale.delete.resolves();
    });

    describe('with confirmation', function () {
      beforeEach(function () {
        this.scope.closeState = sinon.stub();
        this.modalDialog.openConfirmDialog.resolves({confirmed: true});
        this.controller.delete.execute();
        this.$apply();
      });

      it('info notification is shown', function () {
        sinon.assert.called(this.notification.info);
        expect(this.notification.info.args[0][0]).toEqual('Locale deleted successfully');
      });

      it('is logged to analytics', function () {
        sinon.assert.calledWith(this.analytics.track, 'Clicked Delete Locale Button');
      });

      it('sets form to submitted state', function() {
        sinon.assert.called(this.scope.localeForm.$setSubmitted);
      });

      it('closes the current state', function() {
        sinon.assert.calledOnce(this.scope.closeState);
      });
    });

    describe('with no confirmation', function() {
      beforeEach(function () {
        this.modalDialog.openConfirmDialog.resolves({});
        this.controller.delete.execute();
        this.$apply();
      });

      it('does not delete locale', function() {
        sinon.assert.notCalled(this.scope.locale.delete);
      });

      it('sets form to submitted state', function() {
        sinon.assert.called(this.scope.localeForm.$setSubmitted);
      });
    });
  });

  describe('#delete command failures', function () {
    var error = { body: { message: 'errorMessage' }};
    beforeEach(function () {
      this.scope.localeForm.$dirty = true;
      this.scope.locale.delete.returns(this.$q.reject(error));
      this.modalDialog.openConfirmDialog.returns(this.$q.when({confirmed: true}));
      this.controller.delete.execute();
      this.$apply();
    });

    it('error notification is shown', function () {
      expect(this.notification.warn.args[0][0]).toEqual('Locale could not be deleted: ' + error.body.message);
    });

    it('error is logged', function () {
      expect(this.logger.logServerWarn.args[0][1]).toEqual({error: error});
    });

    it('is logged to analytics', function () {
      sinon.assert.calledWith(this.analytics.track, 'Clicked Delete Locale Button');
    });

    it('sets form to submitted state', function() {
      sinon.assert.called(this.scope.localeForm.$setSubmitted);
    });

    it('sets form back to pristine state', function() {
      sinon.assert.called(this.scope.localeForm.$setPristine);
    });

    it('sets form back to dirty state if previously dirty', function() {
      sinon.assert.called(this.scope.localeForm.$setDirty);
    });
  });

  describe('#save command succeeds', function () {

    describe('with unchanged code', function() {
      beforeEach(function () {
        this.controller.save.execute();
        this.$apply();
      });

      it('info notification is shown', function () {
        sinon.assert.called(this.notification.info);
        expect(this.notification.info.args[0][0]).toEqual('Locale saved successfully');
      });

      it('form is reset as pristine', function () {
        sinon.assert.called(this.scope.localeForm.$setPristine);
      });

      it('refreshes locales', function() {
        sinon.assert.called(this.TheLocaleStoreMock.refreshLocales);
      });

      it('is logged to analytics', function () {
        sinon.assert.calledWith(this.analytics.track, 'Saved Successful Locale');
      });

      it('sets form to submitted state', function() {
        sinon.assert.called(this.scope.localeForm.$setSubmitted);
      });

      it('sets form back to pristine state', function() {
        sinon.assert.called(this.scope.localeForm.$setPristine);
      });
    });

    describe('with changed code', function() {
      beforeEach(function() {
        this.scope.initialLocaleCode = 'en-US';
        this.scope.locale.data.code = 'en-UK';
      });

      describe('with confirmation', function() {
        beforeEach(function() {
          this.modalDialog.openConfirmDialog.returns(this.$q.when({confirmed: true}));
          this.controller.save.execute();
          this.$apply();
        });

        it('saves locale', function() {
          sinon.assert.called(this.scope.locale.save);
        });

        it('sets form to submitted state', function() {
          sinon.assert.called(this.scope.localeForm.$setSubmitted);
        });

        it('sets form back to pristine state', function() {
          sinon.assert.called(this.scope.localeForm.$setPristine);
        });
      });

      describe('with no confirmation', function() {
        beforeEach(function() {
          this.modalDialog.openConfirmDialog.returns(this.$q.when({}));
          this.controller.save.execute();
          this.$apply();
        });

        it('saves locale', function() {
          sinon.assert.notCalled(this.scope.locale.save);
        });

        it('sets form to submitted state', function() {
          sinon.assert.called(this.scope.localeForm.$setSubmitted);
        });

        it('sets form back to pristine state', function() {
          sinon.assert.called(this.scope.localeForm.$setPristine);
        });
      });

    });
  });

  describe('#save command fails', function () {
    beforeEach(function () {
      this.scope.locale.save.returns(this.$q.reject({}));
      this.scope.localeForm.$dirty = true;
      this.controller.save.execute();
      this.$apply();
    });

    it('error notification is shown', function () {
      expect(this.notification.warn.args[0][0]).toEqual('Locale could not be saved');
    });

    it('error is logged', function () {
      expect(this.logger.logServerWarn.args[0][1]).toEqual({error: {}});
    });

    it('is logged to analytics', function () {
      sinon.assert.calledWith(this.analytics.track, 'Saved Errored Locale');
    });

    it('sets form to submitted state', function() {
      sinon.assert.called(this.scope.localeForm.$setSubmitted);
    });

    it('sets form back to dirty state', function() {
      sinon.assert.called(this.scope.localeForm.$setDirty);
    });
  });
});
