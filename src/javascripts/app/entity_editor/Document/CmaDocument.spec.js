import _ from 'lodash';
import jestKefir from 'jest-kefir';

import * as K from '../../../../../test/utils/kefir';
import * as Kefir from 'utils/kefir';

import * as CmaDocument from './CmaDocument';
import * as OtDocument from './OtDocument';
import { DocLoad } from 'data/sharejs/Connection';

const kefirHelpers = jestKefir(Kefir); // https://github.com/kefirjs/jest-kefir
const { value } = kefirHelpers; // end
expect.extend(kefirHelpers.extensions);

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

jest.mock('NgRegistry', () => ({
  getModule: jest.fn(() => {})
}));

async function createOtDocument(initialEntity, spaceEndpoint) {
  this.DocLoad = (await this.system.import('data/sharejs/Connection')).DocLoad;

  const docLoader = {
    doc: K.createMockProperty(this.DocLoad.None()),
    destroy: jest.fn(),
    close: jest.fn()
  };

  const docConnection = {
    getDocLoader: jest.fn().returns(docLoader),
    refreshAuth: jest.fn().resolves()
  };
  return OtDocument.create(docConnection, initialEntity, this.contentType, { sys: { id: 'USER' } });
}

[
  ['CmaDocument', CmaDocument.create],
  ['OtDocument', createOtDocument]
].forEach(([documentType, createDocument]) => {
  describe.only(documentType, () => {
    let cmaDoc;

    beforeEach(async () => {
      cmaDoc = createDocument(ENTRY, 'fake/endpoint');
    });

    // a stream of changes on the document (either remotely or locally)
    describe.only('changes', () => {
      it('is a Kefir.Stream', () => {
        expect(cmaDoc.changes).toBeStream();
      });

      describe('emits the changed value immediately after', () => {
        const fieldPath = ['fields', 'fieldA', 'en-US'];
        
        it('setValueAt(fieldPath) on a field', () => {
          expect(cmaDoc.changes).toEmit([value(fieldPath)], () => {
            cmaDoc.setValueAt(fieldPath, 'en-US-updated');
          });
        });

        it('pushValueAt(fieldPath) on a field', () => {
          expect(cmaDoc.changes).toEmit([value(fieldPath)], () => {
            cmaDoc.pushValueAt(fieldPath, 'en-US-updated-2');
          });
        });

        it('removeValueAt(fieldPath) on a field', () => {
          expect(cmaDoc.changes).toEmit([value(fieldPath)], () => {
            cmaDoc.removeValueAt(fieldPath);
          });
        });
      });
    });


    describe.only('data$', () => {
      it('is a Kefir.Property', () => {
        expect(cmaDoc.data$).toBeProperty();
      });

      it('emits initial entity data', () => {
        K.assertCurrentValue(cmaDoc.data$, ENTRY.data);
      });
    });

    describe('initially', () => {
      describe('state', () => {
        //a stream of error values re: opening/updating the document
        describe('error$', () => {
          it('', () => {
          // todo
          });
        });

        //bool describing whether the document has changes unacknowledged by the server
        describe('isSaving$', () => {
          it('', () => {
          // todo
          });
        });

        //bool that is false if the doc is:
        //-published
        //-does not contain changes relative to the published version
        describe('isDirty$', () => {
          it('', () => {
          // todo
          });
        });

        // - bool that is true if all of the following are true
        // the user has update permissions for the entity
        // the entity is not archived or deleted
        // the doc is connected to the server (maybe we don’t need to test this, since “connected” w/o shareJS isn’t relevant)
        // NB: does not take field-based auth into account!
        describe('canEdit$', () => {
          it('', () => {
          // todo
          });
        });

        // bool that is true when the doc has been loaded at least once.
        describe('loaded$', () => {
          it('if loading fails this is true', () => {
          // todo
          });
          it('if the doc is in read-only mode this is true', () => {
            // todo
          });
          it('if the doc is unloaded later this is true', () => {
          // todo
          });
        });
      });


      //keeps track of the entity’s sys property
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
});
