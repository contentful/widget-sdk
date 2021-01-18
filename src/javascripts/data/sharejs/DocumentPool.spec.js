import { FLAGS, getVariation } from 'LaunchDarkly';
import * as K from '__mocks__/kefirMock';
import { createOtDoc, createCmaDoc } from 'app/entity_editor/Document';
import { create as createPool } from 'data/sharejs/DocumentPool';
import { create as createEntityRepo } from 'data/CMA/EntityRepo';
import { logError } from 'services/logger';
import { times } from 'lodash';

// Mock Angular getModule for PresenceHub in OtDocument
jest.mock('core/NgRegistry', () => ({
  getModule: () => ({
    create: () => ({
      destroy: () => jest.fn(),
      leave: () => jest.fn(),
    }),
  }),
}));

jest.mock('services/logger', () => ({
  logError: jest.fn(),
}));

const mockEntityRepo = { entityRepo: true };
jest.mock('data/CMA/EntityRepo', () => ({
  create: jest.fn(() => mockEntityRepo),
}));

// We have to provide vales for these because they're overridden as
// undefined in the LaunchDarkly mocks.
FLAGS['SHAREJS_REMOVAL'] = Symbol('SHAREJS_REMOVAL');
FLAGS['PATCH_ENTRY_UPDATES'] = Symbol('PATCH_ENTRY_UPDATES');

let mockDoc1;
let mockDoc2;

jest.mock('app/entity_editor/Document', () => {
  function createDoc(entity) {
    const sys = entity.data.sys;
    if (sys.id === 'id' && sys.type === 'Entry') {
      return mockDoc1;
    }
    return mockDoc2;
  }
  return {
    createOtDoc: jest.fn((_conn, entity) => createDoc(entity)),
    createCmaDoc: jest.fn((entity) => createDoc(entity)),
  };
});

describe('DocumentPool', () => {
  let otDocumentPool;
  let cmaDocumentPool;
  let connection;

  const entry = { data: { sys: { id: 'id', type: 'Entry' } } };
  const entry2 = { data: { sys: { id: 'other', type: 'Entry' } } };
  const asset = { data: { sys: { id: 'id', type: 'Asset' } } };
  const ct = { ct: true };
  const user = { user: true };
  const spaceEndpoint = 'spaceEndpoint';

  beforeEach(async function () {
    mockDoc1 = {
      destroy: jest.fn().mockResolvedValue(),
    };

    mockDoc2 = {
      destroy: jest.fn().mockResolvedValue(),
    };

    connection = {
      open: jest.fn().mockResolvedValue({}),
    };

    getVariation.mockImplementation((flag) => {
      switch (flag) {
        case FLAGS.SHAREJS_REMOVAL:
          return Promise.resolve({ Entry: false, Asset: false });
        case FLAGS.PATCH_ENTRY_UPDATES:
          return Promise.resolve(false);
      }
    });
    otDocumentPool = await createPool(connection, spaceEndpoint);
  });

  describe('instance creation', () => {
    it('returns an object with pool API', function () {
      expect(Object.keys(otDocumentPool).sort()).toEqual(['get', 'destroy'].sort());
    });
  });

  describe('#get', () => {
    function get(id, type, pool) {
      const entity = { data: { sys: { id: id, type: type || 'Entry' } } };
      const lifeline = K.createMockProperty();
      return (pool || otDocumentPool).get(entity, ct, user, lifeline);
    }

    it('creates doc instance if never requested before', function () {
      const ref = get('id');
      expect(ref).toBe(mockDoc1);
      expect(createOtDoc).toBeCalledWith(connection, entry, ct, user, mockEntityRepo);
    });

    it('uses previously requested doc instance', function () {
      const ref1 = get('id');
      const ref2 = get('id');
      expect(ref1).toBe(mockDoc1);
      expect(ref2).toBe(mockDoc1);
      expect(createOtDoc).toBeCalledTimes(1);
    });

    it('does not mix docs for different entities', function () {
      const ref1 = get('id');
      const ref2 = get('other');
      expect(ref1).not.toBe(ref2);
      expect(createOtDoc).toBeCalledTimes(2);
    });

    it('does not mix docs for different types', function () {
      const ref1 = get('id', 'Entry');
      const ref2 = get('id', 'Asset');
      expect(ref1).not.toBe(ref2);
      expect(createOtDoc).toBeCalledTimes(2);
    });

    it('creates cma doc or ot doc instance, depending on the feature flag values', async function () {
      getVariation.mockImplementation((flag) => {
        switch (flag) {
          case FLAGS.SHAREJS_REMOVAL:
            return Promise.resolve({ Entry: true, Asset: false });
          case FLAGS.PATCH_ENTRY_UPDATES:
            return Promise.resolve(false);
        }
      });
      cmaDocumentPool = await createPool(connection, spaceEndpoint);

      get('id', 'Entry', cmaDocumentPool);
      expect(createCmaDoc).toBeCalledTimes(1);
      expect(createCmaDoc).toBeCalledWith(entry, ct, mockEntityRepo, {
        patchEntryUpdates: false,
      });

      get('id', 'Asset', cmaDocumentPool);
      expect(createOtDoc).toBeCalledTimes(1);
      expect(createOtDoc).toBeCalledWith(connection, asset, ct, user, mockEntityRepo);
    });

    describe('creating the CMA document', () => {
      beforeEach(() => {
        getVariation.mockImplementation((flag) => {
          switch (flag) {
            case FLAGS.SHAREJS_REMOVAL:
              return Promise.resolve({ Entry: true });
            case FLAGS.PATCH_ENTRY_UPDATES:
              return Promise.resolve(false);
          }
        });
      });

      describe('triggering the auto_save action', () => {
        describe('on successful shareJS connection', () => {
          it('delegates auto_save calls to the shareJS shout method', async () => {
            const mockShout = jest.fn();
            connection.open.mockResolvedValue({ doc: { shout: mockShout } });
            cmaDocumentPool = await createPool(connection, spaceEndpoint);
            get('id', 'Entry', cmaDocumentPool);
            const [[, , triggerCmaAutoSave]] = createEntityRepo.mock.calls;

            // shout a couple of times before the doc connection opens...
            triggerCmaAutoSave();
            triggerCmaAutoSave();
            expect(mockShout).toBeCalledTimes(0);

            await connection.open();

            // ...to ensure shout queueing works
            expect(mockShout).toBeCalledTimes(2);

            // shout once more to make sure further calls work synchronously
            triggerCmaAutoSave();
            expect(mockShout).toBeCalledTimes(3);
            times(3, (i) => expect(mockShout).toHaveBeenNthCalledWith(i + 1, ['cma-auto-save']));
          });
        });

        describe('on failed shareJS connection', () => {
          it('logs the error to bugsnag', async () => {
            connection.open.mockRejectedValue('boom');
            cmaDocumentPool = await createPool(connection, spaceEndpoint);
            get('id', 'Entry', cmaDocumentPool);
            try {
              await connection.open();
            } catch (error) {
              expect(logError).toBeCalledWith(expect.any(String), error);
            }

            // also, the callback supplied to triggerCmaAutoSave shouldn't break anything
            const [[, , triggerCmaAutoSave]] = createEntityRepo.mock.calls;
            triggerCmaAutoSave();
          });
        });
      });
    });
  });

  describe('disposing', () => {
    let lifeline1;
    let lifeline2;

    beforeEach(function () {
      lifeline1 = K.createMockStream();
      otDocumentPool.get(entry, ct, user, lifeline1);
      lifeline2 = K.createMockStream();
      otDocumentPool.get(entry, ct, user, lifeline2);
    });

    it('does not destroy a doc if there are references being used', function () {
      lifeline1.end();
      expect(mockDoc1.destroy).not.toBeCalled();
    });

    it('destroys a doc when the last refrence is disposed', function () {
      lifeline1.end();
      lifeline2.end();
      expect(mockDoc1.destroy).toBeCalledTimes(1);
    });
  });

  describe('#destroy', () => {
    describe('OT document', () => {
      it('destroys all document instances', () => {
        const lifeline = K.createMockStream();
        otDocumentPool.get(entry, ct, user, lifeline);
        otDocumentPool.get(entry2, ct, user, lifeline);
        otDocumentPool.destroy();
        expect(mockDoc1.destroy).toBeCalledTimes(1);
        expect(mockDoc2.destroy).toBeCalledTimes(1);
      });
    });

    describe('CMA document', () => {
      beforeEach(async () => {
        getVariation.mockImplementation((flag) => {
          switch (flag) {
            case FLAGS.SHAREJS_REMOVAL:
              return Promise.resolve({ Entry: true });
            case FLAGS.PATCH_ENTRY_UPDATES:
              return Promise.resolve(false);
          }
        });
        cmaDocumentPool = await createPool(connection, spaceEndpoint);
      });

      describe('preceding shareJS connection', () => {
        it('destroys all document instances', async () => {
          const lifeline = K.createMockStream();
          cmaDocumentPool.get(entry, ct, user, lifeline);
          cmaDocumentPool.get(entry2, ct, user, lifeline);
          cmaDocumentPool.destroy();
          expect(mockDoc1.destroy).toBeCalledTimes(1);
          expect(mockDoc2.destroy).toBeCalledTimes(1);
        });
      });

      describe('following successful shareJS connection', () => {
        it('destroys all document instances and closes the shareJS connection', async () => {
          const mockDestroy1 = jest.fn();
          const mockDestroy2 = jest.fn();
          connection.open.mockResolvedValueOnce({ destroy: mockDestroy1 });
          connection.open.mockResolvedValueOnce({ destroy: mockDestroy2 });

          // ensure we still destroy the connection when doc.destroy rejects
          mockDoc2.destroy.mockRejectedValue('boom');

          const lifeline = K.createMockStream();
          cmaDocumentPool.get(entry, ct, user, lifeline);
          cmaDocumentPool.get(entry2, ct, user, lifeline);
          await connection.open();

          const cleanups = cmaDocumentPool.destroy();
          try {
            await Promise.all(cleanups);
          } catch (e) {
            expect(e).toBe('boom');
          }
          expect(mockDoc1.destroy).toBeCalledTimes(1);
          expect(mockDoc2.destroy).toBeCalledTimes(1);
          expect(mockDestroy1).toBeCalledTimes(1);
          expect(mockDestroy2).toBeCalledTimes(1);
        });
      });

      describe('following failed shareJS connection', () => {
        it('destroys all document instances', async () => {
          const lifeline = K.createMockStream();
          cmaDocumentPool.get(entry, ct, user, lifeline);
          cmaDocumentPool.get(entry2, ct, user, lifeline);
          cmaDocumentPool.destroy();

          connection.open.mockRejectedValue('boom');
          try {
            await connection.open();
          } catch (e) {
            // not important for this test
          }
          expect(mockDoc1.destroy).toBeCalledTimes(1);
          expect(mockDoc2.destroy).toBeCalledTimes(1);
        });
      });
    });
  });
});
