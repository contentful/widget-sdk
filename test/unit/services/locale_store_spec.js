'use strict';

describe('TheLocaleStore', function () {

  beforeEach(function () {
    module('contentful/test');
    inject(function () {
      this.theLocaleStore = this.$inject('TheLocaleStore');
      var cfStub = this.$inject('cfStub');
      this.space = cfStub.space('test');
      this.theLocaleStore.initializeWithSpace(this.space);
    });
  });

  describe('refreshes locales', function () {
    var privateLocales;
    beforeEach(function () {
      privateLocales = [{
          code: 'en-US',
          internal_code: 'en-US'
      }];
      this.space.getPrivateLocales = sinon.stub()
      .returns(privateLocales);
      this.space.getDefaultLocale  = sinon.stub()
      .returns({
        code: 'en-US',
        internal_code: 'en-US'
      });

      this.theLocaleStore.refreshActiveLocales = sinon.stub();
      this.theLocaleStore.refreshLocales();
    });

    it('privateLocales exists', function () {
      expect(_.isArray(this.theLocaleStore.getPrivateLocales())).toBeTruthy();
    });

    it('private locales is the supplied array', function () {
      expect(this.theLocaleStore.getPrivateLocales()).toBe(privateLocales);
    });

    it('refreshes active locales', function () {
      expect(_.isArray(this.theLocaleStore.getActiveLocales())).toBeTruthy();
    });

    it('sets locale state for default locale', function () {
      expect(this.theLocaleStore.getLocaleStates()['en-US']).toBeTruthy();
    });
  });

  describe('refresh active locales', function () {
    beforeEach(function () {
      this.space.getPrivateLocales = sinon.stub().returns([
        {
          code: 'en-US',
          internal_code: 'en-US'
        },
        {
          code: 'pt-PT',
          internal_code: 'pt-PT'
        },
        {
          code: 'pt-BR',
          internal_code: 'pt-BR'
        }
      ]);
      this.theLocaleStore.refreshActiveLocales();
    });

    // refactor because of reasons
    xit('sets new locale states', function () {
      expect(this.theLocaleStore.getLocaleStates()).toEqual({
        'en-US': true,
        'pt-PT': true
      });
    });

    // this whole logic is convoluted, refactor
    xit('sets new active locales', function () {
      expect(this.theLocaleStore.getActiveLocales()).toEqual([
        {
          code: 'en-US',
          internal_code: 'en-US'
        },
        {
          code: 'pt-PT',
          internal_code: 'pt-PT'
        }
      ]);
    });
  });

});
