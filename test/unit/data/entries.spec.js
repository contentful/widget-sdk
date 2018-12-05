'use strict';
import _ from 'lodash';

describe('data/Entries', () => {
  beforeEach(function() {
    module('contentful/test');
    this.entries = this.$inject('data/Entries');

    _.extend(this.$inject('TheLocaleStore'), {
      toPublicCode: (this.toPublicCode = sinon.stub()),
      toInternalCode: (this.toInternalCode = sinon.stub())
    });
  });

  describe('path transformation', () => {
    const ctData = { fields: [{ id: 'internal-id', apiName: 'external-id' }] };

    it('transforms internal path to external', function() {
      const internal = ['fields', 'internal-id', 'internal-lang'];
      this.toPublicCode.withArgs('internal-lang').returns('public-lang');
      const external = this.entries.internalPathToExternal(ctData, internal);
      expect(external).toEqual(['fields', 'external-id', 'public-lang']);
    });

    it('transforms internal path to external', function() {
      const external = ['fields', 'external-id', 'public-lang'];
      this.toInternalCode.withArgs('public-lang').returns('internal-lang');
      const internal = this.entries.externalPathToInternal(ctData, external);
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
      this.toPublicCode.withArgs('internal-lang-1').returns('public-lang-1');
      this.toPublicCode.withArgs('internal-lang-2').returns('public-lang-2');

      const external = this.entries.internalToExternal(internalData, ctData);
      // test structure
      expect(external).toEqual(externalData);
      // test cloning
      expect(external.sys).not.toBe(sys);
      expect(external.fields['external-id-2']['public-lang-2']).not.toBe(objVal);
    });

    it('transforms external representation to internal', function() {
      this.toInternalCode.withArgs('public-lang-1').returns('internal-lang-1');
      this.toInternalCode.withArgs('public-lang-2').returns('internal-lang-2');

      const internal = this.entries.externalToInternal(externalData, ctData);
      // test structure
      expect(internal).toEqual(internalData);
      // test cloning
      expect(internal.sys).not.toBe(sys);
      expect(internal.fields['internal-id-2']['internal-lang-2']).not.toBe(objVal);
    });
  });
});
