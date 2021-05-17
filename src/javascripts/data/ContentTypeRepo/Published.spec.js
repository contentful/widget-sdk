import * as K from '__mocks__/kefirMock';
import _ from 'lodash';

import * as CTRepo from 'data/ContentTypeRepo/Published';

describe('data/ContentTypeRepo/Published', () => {
  let repo, idValues, cma;

  beforeEach(async function () {
    cma = {
      raw: {
        getDefaultParams: jest.fn(() => ({ spaceId: 'space-id', environmentId: 'env-id' })),
        get: jest.fn().mockResolvedValue({ items: [] }),
        put: jest.fn(function (_, data) {
          return Promise.resolve(data);
        }),
      },
      contentType: {
        unpublish: jest.fn(),
      },
    };
    repo = CTRepo.create(cma);

    const itemIds = repo.items$.map((ctList) => {
      return ctList.map((ct) => ct.sys.id);
    });
    idValues = K.extractValues(itemIds);
  });

  describe('#fetch()', () => {
    beforeEach(function () {
      cma.raw.get.mockResolvedValue({ items: [makeCtMock('already_fetched')] });
      repo.refresh();
      cma.raw.get.mockClear();

      cma.raw.get.mockResolvedValue({
        items: [makeCtMock('already_fetched'), makeCtMock('to_be_fetched')],
      });
    });

    it('resolves without reloading when content type exists', async function () {
      const ct = await repo.fetch('already_fetched');
      expect(ct.sys.id).toBe('already_fetched');
      expect(cma.raw.get).not.toHaveBeenCalled();
    });

    it('resolves after reloading the published content types', async function () {
      const ct = await repo.fetch('to_be_fetched');
      expect(ct.sys.id).toBe('to_be_fetched');
      expect(cma.raw.get).toHaveBeenCalled();
    });

    it('emits new items list when ct is fetched', async function () {
      await repo.fetch('to_be_fetched');
      expect(idValues[0]).toEqual(['already_fetched', 'to_be_fetched']);
    });
  });

  describe('#get()', () => {
    beforeEach(function () {
      cma.raw.get.mockResolvedValue({ items: [makeCtMock('already_fetched')] });
      repo.refresh();

      expect(cma.raw.get.mock.calls[0][0]).toEqual(
        `/spaces/space-id/environments/env-id/public/content_types?limit=1000`
      );
      expect(cma.raw.get.mock.calls[0][1]).toMatchObject({
        headers: { 'x-contentful-skip-transformation': true },
      });
      cma.raw.get.mockClear();
    });

    it('returns existing ct and does not trigger refresh', function () {
      const ct = repo.get('already_fetched');
      expect(ct.sys.id).toBe('already_fetched');
      expect(cma.raw.get).not.toHaveBeenCalled();
    });

    it('triggers refresh when content type is not available', function () {
      repo.get('foo');
      expect(cma.raw.get).toHaveBeenCalled();
    });
  });

  describe('#refresh()', () => {
    it('requests published content types', function () {
      expect(cma.raw.get).not.toHaveBeenCalled();
      repo.refresh();
      expect(cma.raw.get).toHaveBeenCalledTimes(1);
    });

    it('emits new items', async function () {
      idValues.splice(0);

      cma.raw.get.mockResolvedValue({ items: [makeCtMock('A'), makeCtMock('B')] });
      await repo.refresh();

      cma.raw.get.mockResolvedValue({ items: [makeCtMock('C'), makeCtMock('D')] });
      await repo.refresh();

      expect(idValues).toEqual([
        ['C', 'D'],
        ['A', 'B'],
      ]);
    });

    it('filters deleted items', async function () {
      cma.raw.get.mockResolvedValue({
        items: [makeCtMock('A'), makeCtMock('B', { isDeleted: true }), makeCtMock('C')],
      });
      await repo.refresh();
      expect(idValues[0]).toEqual(['A', 'C']);
    });

    it('sorts content types by name', async function () {
      cma.raw.get.mockResolvedValue({
        items: [
          makeCtMock('A', { name: 'y' }),
          makeCtMock('B', { name: 'Z' }),
          makeCtMock('C', { name: 'X' }),
        ],
      });
      await repo.refresh();
      expect(idValues[0]).toEqual(['C', 'A', 'B']);
    });

    it('returns filtered content types', async function () {
      cma.raw.get.mockResolvedValue({
        items: [makeCtMock('A'), makeCtMock('B', { isDeleted: true }), makeCtMock('C')],
      });
      const cts = await repo.refresh();
      expect(cts.map((ct) => ct.sys.id)).toEqual(['A', 'C']);
    });
  });

  describe('#refreshBare()', () => {
    it('returns bare content type', async function () {
      cma.raw.get.mockResolvedValue({ items: [makeCtMock('A'), makeCtMock('B')] });
      const cts = await repo.refreshBare();
      expect(cts.map((ct) => ct.sys.id)).toEqual(['A', 'B']);
    });
  });

  describe('#publish()', () => {
    it('calls cma.raw.put to perform a publish with necessary headers', async function () {
      const ct = makeCtMock('CTID');
      await repo.publish(ct);
      expect(cma.raw.put).toHaveBeenCalledTimes(1);
      expect(cma.raw.put.mock.calls[0][0]).toEqual(
        `/spaces/space-id/environments/env-id/content_types/${ct.sys.id}/published`
      );
      expect(cma.raw.put.mock.calls[0][1]).toMatchObject(ct);
      expect(cma.raw.put.mock.calls[0][2]).toMatchObject({
        headers: { 'x-contentful-skip-transformation': true, 'x-contentful-version': undefined },
      });
    });

    it('adds content type to repo', async function () {
      const ct = makeCtMock('CTID');
      expect(idValues[0]).not.toContain('CTID');
      await repo.publish(ct);
      expect(idValues[0]).toContain('CTID');
    });
  });

  function makeCtMock(id, opts = {}) {
    const name = opts.name || id;
    return {
      sys: {
        id,
        ...(opts.isDeleted && { deletedAtVersion: 15 }),
      },
      displayField: opts.displayField,
      fields: opts.fields || [],
      name: name,
    };
  }
});
