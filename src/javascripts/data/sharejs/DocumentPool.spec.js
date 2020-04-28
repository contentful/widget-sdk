import { getVariation } from 'LaunchDarkly';
import * as K from '../../../../test/utils/kefir';
import { createOtDoc, createCmaDoc } from 'app/entity_editor/Document';
import { create as createPool } from 'data/sharejs/DocumentPool';

// Mock Angular getModule for PresenceHub in OtDocument
jest.mock('core/NgRegistry', () => ({
  getModule: () => ({
    create: () => ({
      destroy: () => jest.fn(),
      leave: () => jest.fn(),
    }),
  }),
}));

jest.mock('LaunchDarkly', () => ({
  getVariation: jest.fn(),
}));

const mockEntityRepo = { entityRepo: true };
jest.mock('data/CMA/EntityRepo', () => ({
  create: jest.fn(() => mockEntityRepo),
}));

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
      destroy: jest.fn(),
    };

    mockDoc2 = {
      destroy: jest.fn(),
    };

    connection = {};

    getVariation.mockResolvedValue({
      Entry: false,
      Asset: false,
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
      expect(createOtDoc).toBeCalledWith(connection, entry, ct, user, spaceEndpoint);
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
      getVariation.mockResolvedValue({
        Entry: true,
        Asset: false,
      });
      cmaDocumentPool = await createPool(connection, spaceEndpoint);

      get('id', 'Entry', cmaDocumentPool);
      expect(createCmaDoc).toBeCalledTimes(1);
      expect(createCmaDoc).toBeCalledWith(entry, ct, spaceEndpoint, mockEntityRepo);

      get('id', 'Asset', cmaDocumentPool);
      expect(createOtDoc).toBeCalledTimes(1);
      expect(createOtDoc).toBeCalledWith(connection, asset, ct, user, spaceEndpoint);
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
    it('destroys all document instances', function () {
      const lifeline = K.createMockStream();
      otDocumentPool.get(entry, ct, user, lifeline);
      otDocumentPool.get(entry2, ct, user, lifeline);
      otDocumentPool.destroy();
      expect(mockDoc1.destroy).toBeCalledTimes(1);
      expect(mockDoc2.destroy).toBeCalledTimes(1);
    });
  });
});
