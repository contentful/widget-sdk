import _ from 'lodash';
import * as K from '../../../../../test/utils/kefir';
import * as CmaDocument from './CmaDocument';

// import * as Kefir from 'utils/kefir';
// import jestKefir from 'jest-kefir';

// const kefirHelpers = jestKefir(Kefir); // https://github.com/kefirjs/jest-kefir
// const { value, end } = kefirHelpers;
// expect.extend(kefirHelpers.extensions);

const ENTRY = {
  data: {
    sys: {
      type: 'Entry',
      version: 1,
      contentType: {
        sys: { id: 'ctId' }
      }
    },
    fields: {
      fieldA: { 'en-US': 'en' },
      fieldB: { 'en-US': 'val-EN', de: 'val-DE' },
      unknownField: {}
    }
  }
};

describe.skip('CmaDocument', () => {
  let cmaDoc;

  beforeEach(() => {
    cmaDoc = CmaDocument.create(ENTRY, 'fake/endpoint');
  });

  describe('initially', () => {
    describe('data$', () => {
      it('is a Kefir.Property', () => {
        expect(cmaDoc.data$).toBeProperty();
      });

      it('emits initial entity data', () => {
        K.assertCurrentValue(cmaDoc.data$, ENTRY.data);
      });
    });

    describe('changes', () => {
      it('is a Kefir.Stream', () => {
        expect(cmaDoc.changes).toBeStream();
      });
    });

    describe('sysProperty', () => {
      it('is a Kefir.Property', () => {
        expect(cmaDoc.sysProperty).toBeProperty();
      });

      it('emits entity.data.sys as initial value', function() {
        K.assertCurrentValue(cmaDoc.sysProperty, ENTRY.data.sys);
      });
    });

    describe('getValueAt(fieldPath)', () => {
      it('returns initial value', function() {
        expect(cmaDoc.getValueAt(['fields', 'fieldA', 'en-US'])).toBe('en');
      });
    });

    // TODO: Since getValueAt() fn is kind of redundant
    //  with this one, maybe just combine tests.
    describe('valuePropertyAt(fieldPath)', () => {
      it('returns a K.Property with initial', function() {
        K.assertCurrentValue(cmaDoc.valuePropertyAt(['fields', 'fieldA', 'en-US']), 'en');
      });
    });

    describe('getVersion()', () => {
      it('returns version of initial entity', function() {
        expect(cmaDoc.getVersion()).toBe(1);
      });
    });
  });

  describe('immediately after setValueAt(fieldPath) on a field', () => {
    const fieldPath = ['fields', 'fieldA', 'en-US'];
    const anotherFieldPath = ['fields', 'fieldB', 'en-US'];

    beforeEach(() => {
      cmaDoc.setValueAt(fieldPath, 'en-US-updated');
    });

    // ASSUMPTION: We do "optimistic updating"

    it('triggers no CMA request for the next 5 sec.', () => {
      throwNotImplementedError();
    });

    describe('data$', () => {
      it('exposes updated entity data', () => {
        const updatedEntry = _.set(_.cloneDeep(ENTRY.data), fieldPath, 'en-US-updated');
        K.assertCurrentValue(cmaDoc.data$, updatedEntry);
      });
    });

    describe('changes', () => {
      it('emits the changed value', () => {
        // expect(cmaDoc.changes).toEmit([value(anotherFieldPath)], () => {
        //   cmaDoc.setValueAt(anotherFieldPath, 'de-DE-updated');
        // });
      });
    });

    describe('sysProperty', () => {
      it('did not change since initial state', function() {
        K.assertCurrentValue(cmaDoc.sysProperty, ENTRY.data.sys);
      });
    });

    describe('getValueAt(path)', () => {
      it('returns updated value for `path=fieldPath`', () => {
        expect(cmaDoc.getValueAt(fieldPath)).toBe('en-US-updated');
      });

      it('returns initial value if `path=anotherFieldPath`', () => {
        expect(cmaDoc.getValueAt(anotherFieldPath)).toBe('val-EN');
      });
    });
  });

  describe('5 sec. after setValueAt(fieldPath) on a field', () => {
    it('triggers CMA request', () => {
      throwNotImplementedError();
    });
  });

  describe('multiple setValueAt() calls within 5s', () => {
    it('sends one CMA request', () => {
      throwNotImplementedError();
    });
  });
});

function throwNotImplementedError() {
  throw new Error('Not implemented!');
}
