'use strict';

describe('TheLocaleStore', () => {
  const makeLocale = (code, sid = 'SID') => {
    return {
      sys: {space: {sys: {id: sid}}},
      code,

      internal_code: code,
      contentManagementApi: true
    };
  };

  const makeDefaultLocale = (code, sid) => {
    return _.extend(makeLocale(code, sid), {default: true});
  };

  const makeTestLocales = sid => [
    makeDefaultLocale('en-US', sid),
    makeLocale('de-DE', sid),
    _.extend(makeLocale('pl-PL', sid), {contentManagementApi: false})
  ];

  const makeRepo = items => ({getAll: () => Promise.resolve(items)});

  beforeEach(function* () {
    module('contentful/test');
    const getStore = this.$inject('TheStore').getStore;
    this.store = getStore();
    this.clientStorageWrapper = this.$inject('TheStore/ClientStorageWrapper');
    this.theLocaleStore = this.$inject('TheLocaleStore');
    yield this.theLocaleStore.init(makeRepo(makeTestLocales()));
  });

  describe('refreshes locales', () => {
    beforeEach(function* () {
      yield this.theLocaleStore.init(makeRepo(makeTestLocales()));
    });

    it('gets all locales', function () {
      expect(this.theLocaleStore.getLocales()).toEqual(makeTestLocales());
    });

    it('private locales are those enabled for entity editors (CMA)', function () {
      const privateLocales = makeTestLocales().filter(l => l.contentManagementApi);
      expect(this.theLocaleStore.getPrivateLocales()).toEqual(privateLocales);
    });

    it('gets default locale', function () {
      expect(this.theLocaleStore.getDefaultLocale()).toEqual(makeTestLocales()[0]);
    });

    it('falls back to the first locale if no `default` flag is set', function* () {
      const locales = makeTestLocales();
      delete locales[0].default;
      yield this.theLocaleStore.init(makeRepo(locales));
      expect(this.theLocaleStore.getDefaultLocale()).toEqual(locales[0]);
    });

    it('gets active locale states', function () {
      expect(this.theLocaleStore.isLocaleActive(makeLocale('en-US'))).toBe(true);
      expect(this.theLocaleStore.isLocaleActive(makeLocale('de-DE'))).toBe(false);
    });

    it('gets updated active locales', function () {
      expect(this.theLocaleStore.getActiveLocales()).toEqual([makeDefaultLocale('en-US')]);
    });

    describe('changes active locales', () => {
      beforeEach(function () {
        this.theLocaleStore.setActiveLocales([
          makeLocale('en-US'),
          makeLocale('de-DE')
        ]);
      });

      it('gets updated active locale states', function () {
        expect(this.theLocaleStore.isLocaleActive(makeLocale('en-US'))).toBe(true);
        expect(this.theLocaleStore.isLocaleActive(makeLocale('de-DE'))).toBe(true);
      });

      it('gets updated active locales', function () {
        const active = makeTestLocales().filter(l => l.contentManagementApi);
        expect(this.theLocaleStore.getActiveLocales()).toEqual(active);
      });
    });
  });

  describe('#setActiveLocales', () => {
    it('activates given locale', function () {
      const locale = makeLocale('zz');
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(false);
      this.theLocaleStore.setActiveLocales([locale]);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(true);
    });

    it('removes other locales', function () {
      const a = makeLocale('aa');
      const b = makeLocale('bb');
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

  describe('#deactivateLocale', () => {
    it('it makes locale inactive', function () {
      const locale = makeLocale('zz');
      this.theLocaleStore.setActiveLocales([locale]);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(true);
      this.theLocaleStore.deactivateLocale(locale);
      expect(this.theLocaleStore.isLocaleActive(locale)).toBe(false);
    });
  });

  describe('persistence', () => {
    const saved = makeLocale('save');
    const notSaved = makeLocale('nosave');
    const key = sid => `activeLocalesForSpace.${sid}`;

    it('gets different stores for different spaces', function* () {
      yield this.theLocaleStore.init(makeRepo(makeTestLocales('sid1')));
      expect(this.clientStorageWrapper._store['activeLocalesForSpace.sid1']).toBeDefined();
      expect(this.clientStorageWrapper._store['activeLocalesForSpace.sid2']).not.toBeDefined();

      yield this.theLocaleStore.init(makeRepo(makeTestLocales('sid2')));
      expect(this.clientStorageWrapper._store['activeLocalesForSpace.sid2']).toBeDefined();
    });

    it('activates locales form the store', function* () {
      const persistor = this.store.forKey(key('SID'));
      persistor.set(['save']);
      const locales = makeTestLocales().concat([saved, notSaved]);
      yield this.theLocaleStore.init(makeRepo(locales));

      expect(this.theLocaleStore.isLocaleActive(saved)).toBe(true);
      expect(this.theLocaleStore.isLocaleActive(notSaved)).toBe(false);
    });

    it('saves locales to store', function* () {
      const persistor = this.store.forKey(key('SID'));
      const locales1 = makeTestLocales().concat([saved]);
      yield this.theLocaleStore.init(makeRepo(locales1));
      expect(persistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([saved]);
      expect(persistor.get()).toEqual(['en-US', 'save']);

      const sid2 = 'another';
      const locales2 = makeTestLocales(sid2).concat([makeLocale('de-DE', sid2)]);
      yield this.theLocaleStore.init(makeRepo(locales2));
      const anotherPersistor = this.store.forKey(key(sid2));

      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([makeLocale('de-DE')]);
      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US', 'de-DE']);
    });
  });
});
