import * as sinon from 'helpers/sinon';

describe('Locale editor controller', function () {
  beforeEach(function () {
    const self = this;
    this.logger = {
      logServerWarn: sinon.stub()
    };
    this.notification = {
      info: sinon.stub(),
      error: sinon.stub()
    };
    this.modalDialog = {
      openConfirmDialog: sinon.stub(),
      open: sinon.stub()
    };
    this.closeStateSpy = sinon.spy();

    module('contentful/test', function ($provide) {
      $provide.value('logger', self.logger);
      $provide.value('notification', self.notification);
      $provide.value('analytics/Analytics', self.analytics);
      $provide.value('modalDialog', self.modalDialog);
      $provide.value('navigation/closeState', self.closeStateSpy);
      $provide.value('analytics/events/SearchAndViews', {});
    });

    this.spaceContext = this.$inject('spaceContext');
    this.localeStub = {
      delete: sinon.stub(),
      save: sinon.stub()
    };
    this.spaceContext.space = {
      newLocale: sinon.stub().callsFake(() => this.localeStub),
      data: {organization: {subscriptionPlan: {name: 'Unlimited'}}}
    };

    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.init = sinon.stub().resolves();
    this.localeStore.refresh = sinon.stub().resolves();

    this.scope = this.$inject('$rootScope').$new();
    this.scope.context = {};

    this.scope.localeForm = {
      $setPristine: sinon.stub(),
      $setDirty: sinon.stub(),
      $setSubmitted: sinon.stub()
    };

    this.scope.locale = locale('en-US', 'English');

    this.scope.spaceLocales = [
      locale('en-US', 'English'),
      locale('pl-PL', 'Polish'),
      locale('de-DE', 'German')
    ];

    const $controller = this.$inject('$controller');
    this.init = () => {
      this.controller = $controller('LocaleEditorController', {$scope: this.scope});
      this.$apply();
    };
    this.init();
  });

  function locale (code, name, fallbackCode, ext) {
    return _.merge({
      sys: {id: `locale-id-${code}`},
      name, code, fallbackCode,
      contentDeliveryApi: true
    }, ext || {});
  }

  it('sets a locale on the scope', function () {
    expect(this.scope.locale).toBeDefined();
  });

  it('sets the state title', function () {
    this.scope.locale.code = 'de-DE';
    this.scope.$digest();
    expect(this.scope.context.title).toEqual('German (Germany)');
  });

  it('sets the dirty param on the tab', function () {
    this.scope.localeForm.$dirty = true;
    this.scope.$apply();
    expect(this.scope.context.dirty).toBeTruthy();
  });

  it('checks for dependant locales', function () {
    expect(this.scope.hasDependantLocales).toBe(false);

    this.scope.locale.code = 'pl-PL';
    this.scope.spaceLocales.push(locale('fr-FR', 'French', 'pl-PL'));
    const $controller = this.$inject('$controller');
    $controller('LocaleEditorController', {$scope: this.scope});
    this.$apply();
    expect(this.scope.hasDependantLocales).toBe(true);
  });

  describe('changing locale code', function () {
    it('resets fallback if used as locale code', function () {
      this.scope.locale.fallbackCode = 'de-DE';
      this.scope.locale.code = 'de-DE';
      this.$apply();
      expect(this.scope.locale.fallbackCode).toBe(null);
    });

    it('sets available fallback locales', function () {
      const noDelivery = locale('fr-FR', 'French', null, {contentDeliveryApi: false});
      this.scope.spaceLocales.push(noDelivery);
      this.scope.locale.code = 'de-DE';
      this.$apply();
      expect(this.scope.fallbackLocales).toEqual([
        {name: 'English', code: 'en-US', label: 'English (en-US)'},
        {name: 'Polish', code: 'pl-PL', label: 'Polish (pl-PL)'}
      ]);
    });
  });

  describe('#delete command succeeds', function () {
    beforeEach(function () {
      this.localeStub.delete.resolves();
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
        sinon.assert.notCalled(this.localeStub.delete);
      });

      it('sets form to submitted state', function () {
        sinon.assert.called(this.scope.localeForm.$setSubmitted);
      });
    });
  });

  describe('#delete when locale is used as a fallback', function () {
    beforeEach(function () {
      this.$q = this.$inject('$q');
      this.scope.locale.code = 'de-DE';
      this.scope.spaceLocales = [
        locale('en-US', 'English'),
        locale('de-DE', 'German', 'en-US'),
        locale('fr-FR', 'French', 'de-DE')
      ];
      this.init(); // grab another set of space locales

      this.modalDialog.openConfirmDialog.resolves({confirmed: true});
      this.modalDialog.open.returns({
        promise: this.$q.resolve('en-US')
      });
      this.localeStub.delete.resolves();
    });

    it('asks for a new fallback', function () {
      this.controller.delete.execute();
      this.$apply();

      sinon.assert.calledOnce(this.modalDialog.open);
      const data = this.modalDialog.open.firstCall.args[0].scopeData;
      const codes = data.availableLocales.map(l => l.code);
      expect(codes).toEqual(['en-US']);

      const updated = _.extend(this.scope.spaceLocales[2], {fallbackCode: 'en-US'});
      sinon.assert.calledOnce(this.spaceContext.space.newLocale.withArgs(updated));
      sinon.assert.calledOnce(this.localeStub.save);
      sinon.assert.calledOnce(this.localeStub.delete);
    });

    it('does not ask if there is no dependant locale', function () {
      this.scope.spaceLocales = this.scope.spaceLocales.slice(0, 2);
      this.init(); // grab another set of space locales

      this.controller.delete.execute();
      this.$apply();
      sinon.assert.notCalled(this.modalDialog.open);
      sinon.assert.calledOnce(this.localeStub.delete);
    });
  });

  describe('#delete command failures', function () {
    const error = { body: { message: 'errorMessage' } };
    beforeEach(function () {
      this.scope.localeForm.$dirty = true;
      this.localeStub.delete.rejects(error);
      this.modalDialog.openConfirmDialog.resolves({confirmed: true});
      this.controller.delete.execute();
      this.$apply();
    });

    it('error notification is shown', function () {
      expect(this.notification.error.args[0][0]).toEqual('Locale could not be deleted: ' + error.body.message);
    });

    it('error is logged', function () {
      expect(this.logger.logServerWarn.args[0][1]).toEqual({error: error});
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
        this.localeStub.save.resolves({data: {sys: {id: 'locale-id'}}});
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
        sinon.assert.called(this.localeStore.refresh);
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
        this.localeStub.save.resolves({data: {sys: {id: 'locale-id'}}});
        this.scope.locale.code = 'en-UK';
      });

      describe('with confirmation', function () {
        beforeEach(function () {
          this.modalDialog.openConfirmDialog.resolves({confirmed: true});
          this.controller.save.execute();
          this.$apply();
        });

        it('saves locale', function () {
          sinon.assert.calledOnce(this.localeStub.save);
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

        it('does not save locale', function () {
          sinon.assert.notCalled(this.localeStub.save);
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
      this.localeStub.save.rejects({});
      this.scope.localeForm.$dirty = true;
      this.controller.save.execute();
      this.$apply();
    });

    it('error notification is shown', function () {
      expect(this.notification.error.args[0][0]).toEqual('Locale could not be saved');
    });

    it('error is logged', function () {
      expect(this.logger.logServerWarn.args[0][1]).toEqual({error: {}});
    });

    it('sets form to submitted state', function () {
      sinon.assert.called(this.scope.localeForm.$setSubmitted);
    });

    it('sets form back to dirty state', function () {
      sinon.assert.called(this.scope.localeForm.$setDirty);
    });
  });
});
