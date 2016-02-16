'use strict';

describe('TheLocaleStore', function () {

  beforeEach(function () {
    module('contentful/test');

    var activeLocales;
    this.localePersistor = {
      get: function () {
        return activeLocales;
      },
      set: function (data) {
        activeLocales = data;
      }
    };

    var TheStore = this.$inject('TheStore');
    sinon.stub(TheStore, 'forKey')
    .withArgs('activeLocales')
    .returns(this.localePersistor);

    this.theLocaleStore = this.$inject('TheLocaleStore');
    var cfStub = this.$inject('cfStub');
    this.space = cfStub.space('test');

    var spaceContext = this.$inject('spaceContext');
    spaceContext.resetWithSpace(this.space);
    this.$inject('$rootScope').$apply();
  });

  describe('refreshes locales', function () {
    var privateLocales;
    beforeEach(function () {
      privateLocales = [
        { code: 'en-US', internal_code: 'en-US' },
        { code: 'de-DE', internal_code: 'de-DE' }
      ];
      this.space.getPrivateLocales = sinon.stub().returns(privateLocales);
      this.space.getDefaultLocale  = sinon.stub().returns({
        code: 'en-US',
        internal_code: 'en-US'
      });

      this.theLocaleStore.refreshLocales();
    });

    it('private locales is the supplied array', function () {
      expect(this.theLocaleStore.getPrivateLocales()).toEqual(privateLocales);
    });

    it('gets default locale', function() {
      expect(this.theLocaleStore.getDefaultLocale()).toEqual(this.space.getDefaultLocale());
    });

    it('gets active locale states', function () {
      expect(this.theLocaleStore.isLocaleActive({internal_code: 'en-US'})).toBe(true);
      expect(this.theLocaleStore.isLocaleActive({internal_code: 'de-DE'})).toBe(false);
    });

    it('gets updated active locales', function() {
      expect(this.theLocaleStore.getActiveLocales()).toEqual([
        { code: 'en-US', internal_code: 'en-US' }
      ]);
    });

    describe('changes active locales', function() {
      beforeEach(function() {
        this.theLocaleStore.setActiveLocales([
          {internal_code: 'en-US'},
          {internal_code: 'de-DE'}
        ]);
      });

      it('gets updated active locale states', function () {
        expect(this.theLocaleStore.isLocaleActive({internal_code: 'en-US'})).toBe(true);
        expect(this.theLocaleStore.isLocaleActive({internal_code: 'de-DE'})).toBe(true);
      });

      it('gets updated active locales', function() {
        expect(this.theLocaleStore.getActiveLocales()).toEqual([
          { code: 'en-US', internal_code: 'en-US' },
          { code: 'de-DE', internal_code: 'de-DE' }
        ]);
      });

    });
  });

  describe('#setActiveLocales', function () {

    it('activates given locale', function () {
      var locale = {internal_code: 'zz'};
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(false);
      this.theLocaleStore.setActiveLocales([locale]);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(true);
    });

    it('removes other locales', function () {
      var a = {internal_code: 'aa'};
      var b = {internal_code: 'bb'};
      this.theLocaleStore.setActiveLocales([a]);
      expect(this.theLocaleStore.isLocaleActive(a)).toBe(true);
      this.theLocaleStore.setActiveLocales([b]);
      expect(this.theLocaleStore.isLocaleActive(a)).toBe(false);
    });

    it('keeps default locale', function () {
      var def = this.theLocaleStore.getDefaultLocale();
      expect(this.theLocaleStore.isLocaleActive(def)).toBe(true);
      this.theLocaleStore.setActiveLocales([]);
      expect(this.theLocaleStore.isLocaleActive(def)).toBe(true);
    });
  });

  describe('#deactivateLocale', function () {

    it('it makes locale inactive', function () {
      var locale = {internal_code: 'zz'};
      this.theLocaleStore.setActiveLocales([locale]);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(true);
      this.theLocaleStore.deactivateLocale(locale);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(false);
    });
  });

  describe('persistence', function () {
    it('activates locales form the store', function () {
      var saved = {internal_code: 'aa', code: 'save', contentManagementApi: true};
      var notSaved = {internal_code: 'bb', code: 'nosave', contentManagementApi: true};
      this.space.data.locales.push(saved, notSaved);
      this.localePersistor.set(['save']);
      this.theLocaleStore.refreshLocales();
      expect(this.theLocaleStore.isLocaleActive(saved)).toBe(true);
      expect(this.theLocaleStore.isLocaleActive(notSaved)).toBe(false);
    });

    it('saves locales to store', function () {
      var save = {internal_code: 'aa', code: 'save', contentManagementApi: true};
      this.space.data.locales.push(save);

      this.theLocaleStore.refreshLocales();
      expect(this.localePersistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([save]);
      expect(this.localePersistor.get()).toEqual(['en-US', 'save']);
    });
  });
});
