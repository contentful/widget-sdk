import { FLAGS } from 'core/feature-flags';
import * as K from '__mocks__/kefirMock';
import { createCmaDoc } from '@contentful/editorial-primitives';

import { create as createPool } from 'data/DocumentPool/DocumentPool';

const mockEntityRepo = {
  entityRepo: true,
  onContentEntityChanged: () => true,
};
jest.mock('@contentful/editorial-primitives', () => ({
  createCmaDoc: jest.fn(({ initialEntity }) => mockCreateDoc(initialEntity)),

  createEntityRepo: jest.fn().mockImplementation(({ applyAction }) => {
    return {
      ...mockEntityRepo,
      applyAction,
    };
  }),
}));

// We have to provide vales for these because they're overridden as
// undefined in the LaunchDarkly mocks.
FLAGS['PATCH_ENTRY_UPDATES'] = Symbol('PATCH_ENTRY_UPDATES');

let mockDoc1;
let mockDoc2;

function mockCreateDoc(entity) {
  const sys = entity.data.sys;
  if (sys.id === 'id' && sys.type === 'Entry') {
    return mockDoc1;
  }
  return mockDoc2;
}

describe('DocumentPool', () => {
  let cmaDocumentPool;

  const entry = { data: { sys: { id: 'id', type: 'Entry' } } };
  const entry2 = { data: { sys: { id: 'other', type: 'Entry' } } };
  const ct = { ct: true };
  const spaceEndpoint = 'spaceEndpoint';

  beforeEach(async function () {
    mockDoc1 = {
      destroy: jest.fn().mockResolvedValue(),
    };

    mockDoc2 = {
      destroy: jest.fn().mockResolvedValue(),
    };

    cmaDocumentPool = await createPool(
      undefined,
      undefined,
      undefined,
      { sys: { id: 'master' } },
      undefined,
      spaceEndpoint
    );
  });

  describe('instance creation', () => {
    it('returns an object with pool API', function () {
      expect(Object.keys(cmaDocumentPool).sort()).toEqual(['get', 'getById', 'destroy'].sort());
    });
  });

  describe('#get', () => {
    function get(id, type, pool) {
      const entity = { data: { sys: { id: id, type: type || 'Entry' } } };
      const lifeline = K.createMockProperty();
      return (pool || cmaDocumentPool).get(entity, ct, lifeline);
    }

    it('creates doc instance if never requested before', function () {
      const ref = get('id');
      expect(ref).toBe(mockDoc1);
      expect(createCmaDoc).toBeCalledWith(
        expect.objectContaining({
          initialEntity: entry,
          contentType: ct,
          entityRepo: expect.objectContaining(mockEntityRepo),
        })
      );
    });

    it('uses previously requested doc instance', function () {
      const ref1 = get('id');
      const ref2 = get('id');
      expect(ref1).toBe(mockDoc1);
      expect(ref2).toBe(mockDoc1);
      expect(createCmaDoc).toBeCalledTimes(1);
    });

    it('does not mix docs for different entities', function () {
      const ref1 = get('id');
      const ref2 = get('other');
      expect(ref1).not.toBe(ref2);
      expect(createCmaDoc).toBeCalledTimes(2);
    });

    it('does not mix docs for different types', function () {
      const ref1 = get('id', 'Entry');
      const ref2 = get('id', 'Asset');
      expect(ref1).not.toBe(ref2);
      expect(createCmaDoc).toBeCalledTimes(2);
    });
  });

  describe('disposing', () => {
    let lifeline1;
    let lifeline2;

    beforeEach(function () {
      lifeline1 = K.createMockStream();
      cmaDocumentPool.get(entry, ct, lifeline1);
      lifeline2 = K.createMockStream();
      cmaDocumentPool.get(entry, ct, lifeline2);
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
    describe('CMA document', () => {
      it('destroys all document instances on lifeline end', async () => {
        const lifeline = K.createMockStream();
        cmaDocumentPool.get(entry, ct, lifeline);
        cmaDocumentPool.get(entry2, ct, lifeline);
        cmaDocumentPool.destroy();
        expect(mockDoc1.destroy).toBeCalledTimes(1);
        expect(mockDoc2.destroy).toBeCalledTimes(1);
      });

      it('destroys all document instances if destroy throws', async () => {
        // ensure we still destroy the connection when doc.destroy rejects
        mockDoc2.destroy.mockRejectedValue('boom');

        const lifeline = K.createMockStream();
        cmaDocumentPool.get(entry, ct, lifeline);
        cmaDocumentPool.get(entry2, ct, lifeline);

        const cleanups = cmaDocumentPool.destroy();
        try {
          await Promise.all(cleanups);
        } catch (e) {
          expect(e).toBe('boom');
        }
        expect(mockDoc1.destroy).toBeCalledTimes(1);
        expect(mockDoc2.destroy).toBeCalledTimes(1);
      });
    });
  });
});
