'use strict';

describe('TheLocaleStore', function () {

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
    this.cfStub = this.$inject('cfStub');
    this.space = this.cfStub.space('test');
    this.theLocaleStore.resetWithSpace(this.space);
  });

  describe('refreshes locales', function () {
    let privateLocales;
    beforeEach(function () {
      privateLocales = [
        { code: 'en-US', internal_code: 'en-US', default: true },
        { code: 'de-DE', internal_code: 'de-DE' }
      ];
      this.space.getPrivateLocales = sinon.stub().returns(privateLocales);

      this.theLocaleStore.refresh();
    });

    it('private locales is the supplied array', function () {
      expect(this.theLocaleStore.getPrivateLocales()).toEqual(privateLocales);
    });

    it('gets default locale', function () {
      expect(this.theLocaleStore.getDefaultLocale()).toEqual(this.space.getPrivateLocales()[0]);
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
        const space = this.cfStub.space(id);
        this.theLocaleStore.resetWithSpace(space);
        const call = this.TheStore.forKey.lastCall;
        expect(call.args[0]).toBe(k(id));
      }.bind(this);

      test('sid1');
      test('sid2');
    });

    it('activates locales form the store', function () {
      const persistor = this.TheStore.forKey(k('test'));
      persistor.set(['save']);
      this.space.data.locales.push(saved, notSaved);
      this.theLocaleStore.refresh();

      expect(this.theLocaleStore.isLocaleActive(saved)).toBe(true);
      expect(this.theLocaleStore.isLocaleActive(notSaved)).toBe(false);
    });

    it('saves locales to store', function () {
      const persistor = this.TheStore.forKey(k('test'));
      this.space.data.locales.push(saved);

      this.theLocaleStore.refresh();
      expect(persistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([saved]);
      expect(persistor.get()).toEqual(['en-US', 'save']);

      const space = this.cfStub.space('another');
      space.data.locales.push(deLocale);
      this.theLocaleStore.resetWithSpace(space);
      const anotherPersistor = this.TheStore.forKey(k('another'));

      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([deLocale]);
      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US', 'de-DE']);
    });
  });
});
