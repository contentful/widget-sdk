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
      openConfirmDialog: sinon.stub(),
      open: sinon.stub()
    };
    this.TheLocaleStoreMock = {
      refresh: sinon.stub()
    };
    this.closeStateSpy = sinon.spy();

    module('contentful/test', function ($provide) {
      $provide.value('logger', self.logger);
      $provide.value('notification', self.notification);
      $provide.value('analytics', self.analytics);
      $provide.value('modalDialog', self.modalDialog);
      $provide.value('TheLocaleStore', self.TheLocaleStoreMock);
      $provide.value('navigation/closeState', self.closeStateSpy);
    });

    this.$inject('tokenStore').refresh = sinon.stub().resolves();
    this.scope = this.$inject('$rootScope').$new();

    var spaceContext = this.$inject('spaceContext');
    spaceContext.space = {};
    dotty.put(spaceContext, 'space.data.organization.subscriptionPlan.name', 'Unlimited');

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
      delete: sinon.stub().resolves(),
      save: sinon.stub().resolves({getId: getIdStub}),
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

  describe('changing locale code', function () {
    it('resets fallback if used as locale code', function () {
      this.scope.locale.data.fallbackCode = 'de-DE';
      this.scope.locale.getCode.returns('de-DE');
      this.$apply();
      expect(this.scope.locale.data.fallbackCode).toBe(null);
    });

    it('sets available fallback locales', function () {
      this.scope.spaceLocales = [
        {getName: _.constant('Polish'), getCode: _.constant('pl-PL')},
        {getName: _.constant('German'), getCode: _.constant('de-DE')}
      ];

      this.scope.locale.getCode.returns('de-DE');
      this.$apply();
      expect(this.scope.fallbackLocales).toEqual([
        {name: 'Polish', code: 'pl-PL'}
      ]);
    });
  });

  describe('#delete command succeeds', function () {
    beforeEach(function () {
      this.scope.locale.delete.resolves();
    });

    describe('with confirmation', function () {
      beforeEach(function () {
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

      it('sets form to submitted state', function () {
        sinon.assert.called(this.scope.localeForm.$setSubmitted);
      });

      it('closes the current state', function () {
        sinon.assert.calledOnce(this.closeStateSpy);
      });
    });

    describe('with no confirmation', function () {
      beforeEach(function () {
        this.modalDialog.openConfirmDialog.resolves({});
        this.controller.delete.execute();
        this.$apply();
      });

      it('does not delete locale', function () {
        sinon.assert.notCalled(this.scope.locale.delete);
      });

      it('sets form to submitted state', function () {
        sinon.assert.called(this.scope.localeForm.$setSubmitted);
      });
    });
  });

  describe('#delete when locale is used as a fallback', function () {
    beforeEach(function () {
      this.$q = this.$inject('$q');
      this.scope.locale.data.code = 'de-DE';
      this.scope.spaceLocales = [
        {data: {fallbackCode: null, name: 'English', code: 'en-US'}, save: this.$q.resolve()},
        {data: {fallbackCode: 'en-US', name: 'German', code: 'de-DE'}, save: this.$q.resolve()},
        {data: {fallbackCode: 'de-DE', name: 'French', code: 'fr-FR'}, save: sinon.stub().resolves()}
      ];
      this.modalDialog.openConfirmDialog.resolves({confirmed: true});
      this.modalDialog.open.returns({
        promise: this.$q.resolve('en-US')
      });
      this.scope.locale.delete.resolves();
    });

    it('asks for a new fallback', function () {
      this.controller.delete.execute();
      this.$apply();

      sinon.assert.calledOnce(this.modalDialog.open);
      const data = this.modalDialog.open.firstCall.args[0].scopeData;
      const codes = data.availableLocales.map((l) => { return l.data.code; });
      expect(codes).toEqual(['en-US']);
      expect(this.scope.spaceLocales[2].data.fallbackCode).toEqual('en-US');
      sinon.assert.calledOnce(this.scope.spaceLocales[2].save);
      sinon.assert.calledOnce(this.scope.locale.delete);
    });

    it('does not ask if there is no dependant locale', function () {
      this.scope.spaceLocales = this.scope.spaceLocales.slice(0, 2);
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.notCalled(this.modalDialog.open);
      sinon.assert.calledOnce(this.scope.locale.delete);
    });
  });

  describe('#delete command failures', function () {
    var error = { body: { message: 'errorMessage' } };
    beforeEach(function () {
      this.scope.localeForm.$dirty = true;
      this.scope.locale.delete.rejects(error);
      this.modalDialog.openConfirmDialog.resolves({confirmed: true});
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

    it('sets form to submitted state', function () {
      sinon.assert.called(this.scope.localeForm.$setSubmitted);
    });

    it('sets form back to pristine state', function () {
      sinon.assert.called(this.scope.localeForm.$setPristine);
    });

    it('sets form back to dirty state if previously dirty', function () {
      sinon.assert.called(this.scope.localeForm.$setDirty);
    });
  });

  describe('#save command succeeds', function () {

    describe('with unchanged code', function () {
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

      it('refreshes locales', function () {
        sinon.assert.called(this.TheLocaleStoreMock.refresh);
      });

      it('is logged to analytics', function () {
        sinon.assert.calledWith(this.analytics.track, 'Saved Successful Locale');
      });

      it('sets form to submitted state', function () {
        sinon.assert.called(this.scope.localeForm.$setSubmitted);
      });

      it('sets form back to pristine state', function () {
        sinon.assert.called(this.scope.localeForm.$setPristine);
      });
    });

    describe('with changed code', function () {
      beforeEach(function () {
        this.scope.initialLocaleCode = 'en-US';
        this.scope.locale.data.code = 'en-UK';
      });

      describe('with confirmation', function () {
        beforeEach(function () {
          this.modalDialog.openConfirmDialog.resolves({confirmed: true});
          this.controller.save.execute();
          this.$apply();
        });

        it('saves locale', function () {
          sinon.assert.called(this.scope.locale.save);
        });

        it('sets form to submitted state', function () {
          sinon.assert.called(this.scope.localeForm.$setSubmitted);
        });

        it('sets form back to pristine state', function () {
          sinon.assert.called(this.scope.localeForm.$setPristine);
        });
      });

      describe('with no confirmation', function () {
        beforeEach(function () {
          this.modalDialog.openConfirmDialog.resolves({});
          this.controller.save.execute();
          this.$apply();
        });

        it('saves locale', function () {
          sinon.assert.notCalled(this.scope.locale.save);
        });

        it('sets form to submitted state', function () {
          sinon.assert.called(this.scope.localeForm.$setSubmitted);
        });

        it('sets form back to pristine state', function () {
          sinon.assert.called(this.scope.localeForm.$setPristine);
        });
      });

    });
  });

  describe('#save command fails', function () {
    beforeEach(function () {
      this.scope.locale.save.rejects({});
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

    it('sets form to submitted state', function () {
      sinon.assert.called(this.scope.localeForm.$setSubmitted);
    });

    it('sets form back to dirty state', function () {
      sinon.assert.called(this.scope.localeForm.$setDirty);
    });
  });
});
