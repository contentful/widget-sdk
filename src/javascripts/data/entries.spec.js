import _ from 'lodash';
import * as Entries from './entries';
import TheLocaleStore from 'services/localeStore';

jest.mock('services/localeStore', () => ({
  toPublicCode: jest.fn(),
  toInternalCode: jest.fn()
}));

describe('data/entries', () => {
  beforeEach(() => {
    TheLocaleStore.toPublicCode.mockReset();
    TheLocaleStore.toInternalCode.mockReset();
  });

  const mockLocaleStore = (method, inputArg, outputArg) => {
    TheLocaleStore[method].mockImplementation(what => {
      if (what === inputArg) {
        return outputArg;
      }
      return what;
    });
  };

  describe('path transformation', () => {
    const ctData = { fields: [{ id: 'internal-id', apiName: 'external-id' }] };

    it('transforms internal path to external', function() {
      mockLocaleStore('toPublicCode', 'internal-lang', 'public-lang');

      const internal = ['fields', 'internal-id', 'internal-lang'];
      const external = Entries.internalPathToExternal(ctData, internal);
      expect(external).toEqual(['fields', 'external-id', 'public-lang']);
    });

    it('transforms external path to internal', function() {
      mockLocaleStore('toInternalCode', 'public-lang', 'internal-lang');

      const external = ['fields', 'external-id', 'public-lang'];
      const internal = Entries.externalPathToInternal(ctData, external);
      expect(internal).toEqual(['fields', 'internal-id', 'internal-lang']);
    });
  });

  describe('entry representation transformation', () => {
    const ctData = {
      fields: [
        { id: 'internal-id-1', apiName: 'external-id-1' },
        { id: 'internal-id-2', apiName: 'external-id-2' }
      ]
    };

    const sys = { some: 'prop' };
    const objVal = { some: { nested: 'obj' } };

    const internalData = {
      sys: sys,
      fields: {
        'internal-id-1': {
          'internal-lang-1': 'test1',
          'internal-lang-2': 'test2'
        },
        // no value for locale 1
        'internal-id-2': { 'internal-lang-2': objVal }
      }
    };

    const externalData = {
      sys: sys,
      fields: {
        'external-id-1': {
          'public-lang-1': 'test1',
          'public-lang-2': 'test2'
        },
        // no value for locale 1
        'external-id-2': { 'public-lang-2': objVal }
      }
    };

    it('transforms internal representation to external', function() {
      TheLocaleStore.toPublicCode.mockImplementation(value => {
        if (value === 'internal-lang-1') {
          return 'public-lang-1';
        } else if (value === 'internal-lang-2') {
          return 'public-lang-2';
        }
        return value;
      });

      const external = Entries.internalToExternal(internalData, ctData);
      // test structure
      expect(external).toEqual(externalData);
      // test cloning
      expect(external.sys).not.toBe(sys);
      expect(external.fields['external-id-2']['public-lang-2']).not.toBe(objVal);
    });

    it('transforms external representation to internal', function() {
      TheLocaleStore.toInternalCode.mockImplementation(value => {
        if (value === 'public-lang-1') {
          return 'internal-lang-1';
        } else if (value === 'public-lang-2') {
          return 'internal-lang-2';
        }
        return value;
      });

      const internal = Entries.externalToInternal(externalData, ctData);
      // test structure
      expect(internal).toEqual(internalData);
      // test cloning
      expect(internal.sys).not.toBe(sys);
      expect(internal.fields['internal-id-2']['internal-lang-2']).not.toBe(objVal);
    });
  });
});
