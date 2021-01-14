import * as K from '../../../../test/utils/kefir';
import _ from 'lodash';

import * as CTRepo from 'data/ContentTypeRepo/Published';

describe('data/ContentTypeRepo/Published', () => {
  let space, repo, idValues;

  beforeEach(async function () {
    space = makeSpaceMock();
    repo = CTRepo.create(space);

    const itemIds = repo.items$.map((ctList) => {
      return ctList.map((ct) => ct.sys.id);
    });
    idValues = K.extractValues(itemIds);
  });

  describe('#fetch()', () => {
    beforeEach(function () {
      space.getPublishedContentTypes.mockResolvedValue([makeCtMock('already_fetched')]);
      repo.refresh();
      space.getPublishedContentTypes.mockClear();

      space.getPublishedContentTypes.mockResolvedValue([
        makeCtMock('already_fetched'),
        makeCtMock('to_be_fetched'),
      ]);
    });

    it('resolves without reloading when content type exists', async function () {
      const ct = await repo.fetch('already_fetched');
      expect(ct.getId()).toBe('already_fetched');
      expect(space.getPublishedContentTypes).not.toHaveBeenCalled();
    });

    it('resolves after reloading the published content types', async function () {
      const ct = await repo.fetch('to_be_fetched');
      expect(ct.getId()).toBe('to_be_fetched');
      expect(space.getPublishedContentTypes).toHaveBeenCalled();
    });

    it('emits new items list when ct is fetched', async function () {
      await repo.fetch('to_be_fetched');
      expect(idValues[0]).toEqual(['already_fetched', 'to_be_fetched']);
    });
  });

  describe('#get()', () => {
    beforeEach(function () {
      space.getPublishedContentTypes.mockResolvedValue([makeCtMock('already_fetched')]);
      repo.refresh();
      space.getPublishedContentTypes.mockClear();
    });

    it('returns existing ct and does not trigger refresh', function () {
      const ct = repo.get('already_fetched');
      expect(ct.getId()).toBe('already_fetched');
      expect(space.getPublishedContentTypes).not.toHaveBeenCalled();
    });

    it('triggers refresh when content type is not available', function () {
      repo.get('foo');
      expect(space.getPublishedContentTypes).toHaveBeenCalled();
    });
  });

  describe('#refresh()', () => {
    it('requests published content types', function () {
      expect(space.getPublishedContentTypes).not.toHaveBeenCalled();
      repo.refresh();
      expect(space.getPublishedContentTypes).toHaveBeenCalledTimes(1);
    });

    it('emits new items', async function () {
      idValues.splice(0);

      space.getPublishedContentTypes.mockResolvedValue([makeCtMock('A'), makeCtMock('B')]);
      await repo.refresh();

      space.getPublishedContentTypes.mockResolvedValue([makeCtMock('C'), makeCtMock('D')]);
      await repo.refresh();

      expect(idValues).toEqual([
        ['C', 'D'],
        ['A', 'B'],
      ]);
    });

    it('filters deleted items', async function () {
      space.getPublishedContentTypes.mockResolvedValue([
        makeCtMock('A'),
        makeCtMock('B', { isDeleted: true }),
        makeCtMock('C'),
      ]);
      await repo.refresh();
      expect(idValues[0]).toEqual(['A', 'C']);
    });

    it('sorts content types by name', async function () {
      space.getPublishedContentTypes.mockResolvedValue([
        makeCtMock('A', { name: 'y' }),
        makeCtMock('B', { name: 'Z' }),
        makeCtMock('C', { name: 'X' }),
      ]);
      await repo.refresh();
      expect(idValues[0]).toEqual(['C', 'A', 'B']);
    });

    it('returns filtered content types', async function () {
      space.getPublishedContentTypes.mockResolvedValue([
        makeCtMock('A'),
        makeCtMock('B', { isDeleted: true }),
        makeCtMock('C'),
      ]);
      const cts = await repo.refresh();
      expect(cts.map((ct) => ct.getId())).toEqual(['A', 'C']);
    });
  });

  describe('#refreshBare()', () => {
    it('returns bare content type', async function () {
      space.getPublishedContentTypes.mockResolvedValue([makeCtMock('A'), makeCtMock('B')]);
      const cts = await repo.refreshBare();
      expect(cts.map((ct) => ct.sys.id)).toEqual(['A', 'B']);
    });
  });

  describe('#publish()', () => {
    it('calls #publish() on content type', async function () {
      const ct = makeCtMock('CTID');
      await repo.publish(ct);
      expect(ct.publish).toHaveBeenCalledTimes(1);
    });

    it('adds content type to repo', async function () {
      const ct = makeCtMock('CTID');
      expect(idValues[0]).not.toContain('CTID');
      await repo.publish(ct);
      expect(idValues[0]).toContain('CTID');
    });
  });

  function makeSpaceMock() {
    return {
      getPublishedContentTypes: jest.fn().mockResolvedValue([]),
    };
  }

  function makeCtMock(id, opts = {}) {
    const name = opts.name || id;
    return {
      data: {
        sys: { id },
        displayField: opts.displayField,
        fields: opts.fields || [],
        name: name,
      },
      getId: _.constant(id),
      isDeleted: _.constant(opts.isDeleted === true),
      getName: _.constant(name),
      publish: jest.fn(function () {
        return Promise.resolve(this);
      }),
    };
  }
});
