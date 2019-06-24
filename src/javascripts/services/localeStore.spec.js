'use strict';

import _ from 'lodash';
import theLocaleStore from './localeStore.es6';

describe('services/localeStore.es6', () => {
  const makeLocale = (code, sid = 'SID') => {
    return {
      sys: { space: { sys: { id: sid } } },
      code,

      internal_code: code,
      contentManagementApi: true
    };
  };

  const makeDefaultLocale = (code, sid) => {
    return _.extend(makeLocale(code, sid), { default: true });
  };

  const makeTestLocales = sid => [
    makeDefaultLocale('en-US', sid),
    makeLocale('de-DE', sid),
    _.extend(makeLocale('pl-PL', sid), { contentManagementApi: false })
  ];

  const makeRepo = items => ({ getAll: () => Promise.resolve(items) });

  beforeEach(async () => {
    await theLocaleStore.init(makeRepo(makeTestLocales()));
  });

  describe('refreshes locales', () => {
    beforeEach(function*() {
      yield theLocaleStore.init(makeRepo(makeTestLocales()));
    });

    it('gets all locales', function() {
      expect(theLocaleStore.getLocales()).toEqual(makeTestLocales());
    });

    it('private locales are those enabled for entity editors (CMA)', function() {
      const privateLocales = makeTestLocales().filter(l => l.contentManagementApi);
      expect(theLocaleStore.getPrivateLocales()).toEqual(privateLocales);
    });

    it('gets default locale', function() {
      expect(theLocaleStore.getDefaultLocale()).toEqual(makeTestLocales()[0]);
    });

    it('falls back to the first locale if no `default` flag is set', function*() {
      const locales = makeTestLocales();
      delete locales[0].default;
      yield theLocaleStore.init(makeRepo(locales));
      expect(theLocaleStore.getDefaultLocale()).toEqual(locales[0]);
    });

    it('gets active locale states', function() {
      expect(theLocaleStore.isLocaleActive(makeLocale('en-US'))).toBe(true);
      expect(theLocaleStore.isLocaleActive(makeLocale('de-DE'))).toBe(false);
    });

    it('gets updated active locales', function() {
      expect(theLocaleStore.getActiveLocales()).toEqual([makeDefaultLocale('en-US')]);
    });

    describe('changes active locales', () => {
      beforeEach(function() {
        theLocaleStore.setActiveLocales([makeLocale('en-US'), makeLocale('de-DE')]);
      });

      it('gets updated active locale states', function() {
        expect(theLocaleStore.isLocaleActive(makeLocale('en-US'))).toBe(true);
        expect(theLocaleStore.isLocaleActive(makeLocale('de-DE'))).toBe(true);
      });

      it('gets updated active locales', function() {
        const active = makeTestLocales().filter(l => l.contentManagementApi);
        expect(theLocaleStore.getActiveLocales()).toEqual(active);
      });
    });
  });

  describe('#setActiveLocales', () => {
    it('activates given locale', function() {
      const locale = makeLocale('zz');
      expect(theLocaleStore.isLocaleActive(locale)).toBe(false);
      theLocaleStore.setActiveLocales([locale]);
      expect(theLocaleStore.isLocaleActive(locale)).toBe(true);
    });

    it('removes other locales', function() {
      const a = makeLocale('aa');
      const b = makeLocale('bb');
      theLocaleStore.setActiveLocales([a]);
      expect(theLocaleStore.isLocaleActive(a)).toBe(true);
      theLocaleStore.setActiveLocales([b]);
      expect(theLocaleStore.isLocaleActive(a)).toBe(false);
    });

    it('keeps default locale', function() {
      const def = theLocaleStore.getDefaultLocale();
      expect(theLocaleStore.isLocaleActive(def)).toBe(true);
      theLocaleStore.setActiveLocales([]);
      expect(theLocaleStore.isLocaleActive(def)).toBe(true);
    });
  });

  describe('#deactivateLocale', () => {
    it('it makes locale inactive', function() {
      const locale = makeLocale('zz');
      theLocaleStore.setActiveLocales([locale]);
      expect(theLocaleStore.isLocaleActive(locale)).toBe(true);
      theLocaleStore.deactivateLocale(locale);
      expect(theLocaleStore.isLocaleActive(locale)).toBe(false);
    });
  });
});
