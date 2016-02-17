'use strict';

describe('TheLocaleStore', function () {

  beforeEach(function () {
    module('contentful/test');

    var persistors = {};
    var persistorGet = function () { return this.activeLocales; };
    var persisotrSet = function (data) { this.activeLocales = data; };

    this.TheStore = this.$inject('TheStore');
    this.TheStore.forKey = sinon.stub(this.TheStore, 'forKey', function (key) {
      var persitor = persistors[key];
      persistors[key] = persitor = persitor || {get: persistorGet, set: persisotrSet};
      return persitor;
    });

    this.theLocaleStore = this.$inject('TheLocaleStore');
    this.cfStub = this.$inject('cfStub');
    this.space = this.cfStub.space('test');

    this.reset = function (space) {
      this.theLocaleStore.resetWithSpace(space || this.space);
    }.bind(this);

    this.reset();
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

      this.reset();
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
    var saved = {internal_code: 'aa', code: 'save', contentManagementApi: true};
    var notSaved = {internal_code: 'bb', code: 'nosave', contentManagementApi: true};
    var deLocale = {internal_code: 'cc', code: 'de-DE', contentManagementApi: true};

    function k(id) { return 'activeLocalesForSpace.' + id; }

    it('gets different stores for different spaces', function () {
      var test = function (id) {
        this.reset(this.cfStub.space(id));
        var call = this.TheStore.forKey.lastCall;
        expect(call.args[0]).toBe(k(id));
      }.bind(this);

      test('sid1');
      test('sid2');
    });

    it('activates locales form the store', function () {
      var persistor = this.TheStore.forKey(k('test'));
      persistor.set(['save']);
      this.space.data.locales.push(saved, notSaved);
      this.reset();

      expect(this.theLocaleStore.isLocaleActive(saved)).toBe(true);
      expect(this.theLocaleStore.isLocaleActive(notSaved)).toBe(false);
    });

    it('saves locales to store', function () {
      var persistor = this.TheStore.forKey(k('test'));
      this.space.data.locales.push(saved);

      this.reset();
      expect(persistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([saved]);
      expect(persistor.get()).toEqual(['en-US', 'save']);

      var space = this.cfStub.space('another');
      space.data.locales.push(deLocale);
      this.reset(space);
      var anotherPersistor = this.TheStore.forKey(k('another'));

      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US']);

      this.theLocaleStore.setActiveLocales([deLocale]);
      expect(persistor.get()).toEqual(['en-US', 'save']);
      expect(anotherPersistor.get()).toEqual(['en-US', 'de-DE']);
    });
  });
});
