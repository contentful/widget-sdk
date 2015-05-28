'use strict';

describe('Locale editor controller', function () {
  var stubs, localeEditorController;
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'info',
        'warn',
        'logServerWarn',
        'getName',
        'getId',
        'getCode',
        'save',
        'delete',
        'getUpdatedToken',
        'track'
      ]);
      $provide.value('logger', {
        logServerWarn: stubs.logServerWarn
      });
      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn,
        serverError: stubs.serverError
      });
      $provide.value('analytics', {
        track: stubs.track
      });
    });

    this.stubs = stubs;
    this.$q = this.$inject('$q');
    this.scope = this.$inject('$rootScope').$new();
    this.scope.spaceContext = {
      defaultLocale: {
        name: 'U.S. English',
        code: 'en-US'
      }
    };
    dotty.put(this.scope.spaceContext, 'space.data.organization.subscriptionPlan.name', 'Unlimited');
    this.scope.context = {};
    this.scope.locale = {
      data: {},
      getName: stubs.getName.returns('localeName'),
      getId: stubs.getId.returns('someId'),
      'delete': stubs.delete.returns(this.$q.when()),
      save: stubs.save.returns(this.$q.when({getId: stubs.getId})),
      getCode: stubs.getCode,
      isDefault: sinon.stub(),
      getVersion: sinon.stub()
    };
    this.$inject('tokenStore').getUpdatedToken = stubs.getUpdatedToken.returns(this.$q.when());

    localeEditorController = this.$inject('$controller')('LocaleEditorController', {$scope: this.scope});
    this.scope.$apply();
  });

  it('has a closing message', function () {
    expect(this.scope.context.closingMessage).toBeDefined();
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
    this.scope.localeForm = {
      '$dirty': true
    };
    this.scope.$apply();
    expect(this.scope.context.dirty).toBeTruthy();
  });

  describe('deletes a locale', function () {
    beforeEach(function () {
      this.scope.locale.delete.returns(this.$q.when());
      this.scope.delete();
      this.scope.$apply();
    });

    it('info notification is shown', function () {
      sinon.assert.called(stubs.info);
      expect(stubs.info.args[0][0]).toEqual('"localeName" deleted successfully');
    });

    it('is logged to analytics', function () {
      sinon.assert.calledWith(stubs.track, 'Clicked Delete Locale Button');
    });
  });

  describe('fails to delete a locale', function () {
    var error = { body: { message: 'errorMessage' }};
    beforeEach(function () {
      stubs.delete.returns(this.$q.reject(error));
      this.scope.delete();
      this.scope.$apply();
    });

    it('error notification is shown', function () {
      sinon.assert.called(stubs.logServerWarn);
      expect(stubs.warn.args[0][0]).toEqual('"localeName" could not be deleted: ' + error.body.message);
      expect(stubs.logServerWarn.args[0][1]).toEqual({error: error});
    });

    it('is logged to analytics', function () {
      sinon.assert.calledWith(stubs.track, 'Clicked Delete Locale Button');
    });
  });

  describe('saves a locale', function () {
    var pristineStub;
    beforeEach(function () {
      pristineStub = sinon.stub();
      this.scope.$state.go = sinon.stub();
      this.scope.localeForm = {
        '$setPristine': pristineStub
      };
      this.scope.save();
      this.scope.$apply();
    });

    it('info notification is shown', function () {
      sinon.assert.called(stubs.info);
      expect(stubs.info.args[0][0]).toEqual('"localeName" saved successfully');
    });

    it('form is reset as pristine', function () {
      sinon.assert.called(pristineStub);
    });

    it('gets locale editor from navigator', function () {
      sinon.assert.calledWith(this.scope.$state.go, 'spaces.detail.settings.locales.detail', {
        localeId: 'someId'
      });
    });

    it('is logged to analytics', function () {
      sinon.assert.calledWith(stubs.track, 'Saved Successful Locale');
    });
  });

  describe('fails to save a locale', function () {
    beforeEach(function () {
      stubs.save.returns(this.$q.reject({}));
      this.scope.save();
      this.scope.$apply();
    });

    it('error notification is shown', function () {
      sinon.assert.called(stubs.logServerWarn);
      expect(stubs.logServerWarn.args[0][1]).toEqual({error: {}});
      expect(stubs.warn.args[0][0]).toEqual('"localeName" could not be saved');
    });

    it('is logged to analytics', function () {
      sinon.assert.calledWith(stubs.track, 'Saved Errored Locale');
    });
  });
});
