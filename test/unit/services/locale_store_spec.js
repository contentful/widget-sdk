'use strict';

describe('TheLocaleStore', function () {
  const DEFAULT_LOCALES = [
    {code: 'en-US', internal_code: 'en-US', default: true},
    {code: 'de-DE', internal_code: 'de-DE'}
  ];

  beforeEach(function () {
    module('contentful/test');

    const persistors = {};
    const persistorGet = function () { return this.activeLocales; };
    const persistorSet = function (data) { this.activeLocales = data; };

    this.TheStore = this.$inject('TheStore');
    this.TheStore.forKey = sinon.stub(this.TheStore, 'forKey').callsFake((key) => {
      let persitor = persistors[key];
      persistors[key] = persitor = persitor || {get: persistorGet, set: persistorSet};
      return persitor;
    });

    this.theLocaleStore = this.$inject('TheLocaleStore');
    this.theLocaleStore.reset('SPACE ID', DEFAULT_LOCALES);
  });

  describe('refreshes locales', function () {
    let privateLocales;
    beforeEach(function () {
      privateLocales = [
        { code: 'en-US', internal_code: 'en-US', default: true },
        { code: 'de-DE', internal_code: 'de-DE' }
      ];
      this.theLocaleStore.reset('test', privateLocales);
    });

    it('private locales is the supplied array', function () {
      expect(this.theLocaleStore.getPrivateLocales()).toEqual(privateLocales);
    });

    it('gets default locale', function () {
      expect(this.theLocaleStore.getDefaultLocale()).toEqual(privateLocales[0]);
    });

    it('gets active locale states', function () {
      expect(this.theLocaleStore.isLocaleActive({internal_code: 'en-US'})).toBe(true);
      expect(this.theLocaleStore.isLocaleActive({internal_code: 'de-DE'})).toBe(false);
    });

    it('gets updated active locales', function () {
      expect(this.theLocaleStore.getActiveLocales()).toEqual([
        { code: 'en-US', internal_code: 'en-US', default: true }
      ]);
    });

    describe('changes active locales', function () {
      beforeEach(function () {
        this.theLocaleStore.setActiveLocales([
          {internal_code: 'en-US'},
          {internal_code: 'de-DE'}
        ]);
      });

      it('gets updated active locale states', function () {
        expect(this.theLocaleStore.isLocaleActive({internal_code: 'en-US'})).toBe(true);
        expect(this.theLocaleStore.isLocaleActive({internal_code: 'de-DE'})).toBe(true);
      });

      it('gets updated active locales', function () {
        expect(this.theLocaleStore.getActiveLocales()).toEqual([
          { code: 'en-US', internal_code: 'en-US', default: true },
          { code: 'de-DE', internal_code: 'de-DE' }
        ]);
      });
    });
  });

  describe('#setActiveLocales', function () {
    it('activates given locale', function () {
      const locale = {internal_code: 'zz'};
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(false);
      this.theLocaleStore.setActiveLocales([locale]);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(true);
    });

    it('removes other locales', function () {
      const a = {internal_code: 'aa'};
      const b = {internal_code: 'bb'};
      this.theLocaleStore.setActiveLocales([a]);
      expect(this.theLocaleStore.isLocaleActive(a)).toBe(true);
      this.theLocaleStore.setActiveLocales([b]);
      expect(this.theLocaleStore.isLocaleActive(a)).toBe(false);
    });

    it('keeps default locale', function () {
      const def = this.theLocaleStore.getDefaultLocale();
      expect(this.theLocaleStore.isLocaleActive(def)).toBe(true);
      this.theLocaleStore.setActiveLocales([]);
      expect(this.theLocaleStore.isLocaleActive(def)).toBe(true);
    });
  });

  describe('#deactivateLocale', function () {
    it('it makes locale inactive', function () {
      const locale = {internal_code: 'zz'};
      this.theLocaleStore.setActiveLocales([locale]);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(true);
      this.theLocaleStore.deactivateLocale(locale);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(false);
    });
  });

  describe('persistence', function () {
    const saved = {internal_code: 'aa', code: 'save', contentManagementApi: true};
    const notSaved = {internal_code: 'bb', code: 'nosave', contentManagementApi: true};
    const deLocale = {internal_code: 'cc', code: 'de-DE', contentManagementApi: true};

    function k (id) { return 'activeLocalesForSpace.' + id; }

    it('gets different stores for different spaces', function () {
      const test = function (id) {
        this.theLocaleStore.reset(id, DEFAULT_LOCALES);
        const call = this.TheStore.forKey.lastCall;
        expect(call.args[0]).toBe(k(id));
      }.bind(this);

      test('sid1');
      test('sid2');
    });

    it('activates locales form the store', function () {
      const persistor = this.TheStore.forKey(k('test'));
      persistor.set(['save']);
      const locales = DEFAULT_LOCALES.concat([saved, notSaved]);
      this.theLocaleStore.reset('test', locales);

      expect(this.theLocaleStore.isLocaleActive(saved)).toBe(true);
      expect(this.theLocaleStore.isLocaleActive(notSaved)).toBe(false);
    });

    it('saves locales to store', function () {
      const persistor = this.TheStore.forKey(k('test'));
      const locales1 = DEFAULT_LOCALES.concat([saved]);
      this.theLocaleStore.reset('test', locales1);
      expect(persistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([saved]);
      expect(persistor.get()).toEqual(['en-US', 'save']);

      const locales2 = DEFAULT_LOCALES.concat([deLocale]);
      this.theLocaleStore.reset('another', locales2);
      const anotherPersistor = this.TheStore.forKey(k('another'));

      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([deLocale]);
      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US', 'de-DE']);
    });
  });
});
