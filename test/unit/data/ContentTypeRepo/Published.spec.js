import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import _ from 'lodash';
import { $initialize, $inject, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('data/ContentTypeRepo/Published', () => {
  let $q;

  afterEach(() => {
    $q = null;
  });

  beforeEach(async function () {
    const CTRepo = await this.system.import('data/ContentTypeRepo/Published');

    await $initialize(this.system);

    $q = $inject('$q');
    this.space = makeSpaceMock();
    this.repo = CTRepo.create(this.space);

    const itemIds = this.repo.items$.map((ctList) => {
      return ctList.map((ct) => ct.sys.id);
    });
    this.idValues = K.extractValues(itemIds);
  });

  describe('#fetch()', () => {
    beforeEach(function () {
      this.space.getPublishedContentTypes.resolves([makeCtMock('already_fetched')]);
      this.repo.refresh();
      $apply();
      this.space.getPublishedContentTypes.reset();

      this.space.getPublishedContentTypes.resolves([
        makeCtMock('already_fetched'),
        makeCtMock('to_be_fetched'),
      ]);
    });

    it('resolves without reloading when content type exists', async function () {
      const ct = await this.repo.fetch('already_fetched');
      expect(ct.getId()).toBe('already_fetched');
      sinon.assert.notCalled(this.space.getPublishedContentTypes);
    });

    it('resolves after reloading the published content types', async function () {
      const ct = await this.repo.fetch('to_be_fetched');
      expect(ct.getId()).toBe('to_be_fetched');
      sinon.assert.called(this.space.getPublishedContentTypes);
    });

    it('emits new items list when ct is fetched', async function () {
      await this.repo.fetch('to_be_fetched');
      expect(this.idValues[0]).toEqual(['already_fetched', 'to_be_fetched']);
    });
  });

  describe('#get()', () => {
    beforeEach(function () {
      this.space.getPublishedContentTypes.resolves([makeCtMock('already_fetched')]);
      this.repo.refresh();
      $apply();
      this.space.getPublishedContentTypes.resetHistory();
    });

    it('returns existing ct and does not trigger refresh', function () {
      const ct = this.repo.get('already_fetched');
      expect(ct.getId()).toBe('already_fetched');
      sinon.assert.notCalled(this.space.getPublishedContentTypes);
    });

    it('triggers refresh when content type is not available', function () {
      this.repo.get('foo');
      $apply();
      sinon.assert.called(this.space.getPublishedContentTypes);
    });
  });

  describe('#refresh()', () => {
    it('requests published content types', function () {
      sinon.assert.notCalled(this.space.getPublishedContentTypes);
      this.repo.refresh();
      sinon.assert.calledOnce(this.space.getPublishedContentTypes);
    });

    it('emits new items', async function () {
      this.idValues.splice(0);

      this.space.getPublishedContentTypes.resolves([makeCtMock('A'), makeCtMock('B')]);
      await this.repo.refresh();

      this.space.getPublishedContentTypes.resolves([makeCtMock('C'), makeCtMock('D')]);
      await this.repo.refresh();

      expect(this.idValues).toEqual([
        ['C', 'D'],
        ['A', 'B'],
      ]);
    });

    it('filters deleted items', async function () {
      this.space.getPublishedContentTypes.resolves([
        makeCtMock('A'),
        makeCtMock('B', { isDeleted: true }),
        makeCtMock('C'),
      ]);
      await this.repo.refresh();
      expect(this.idValues[0]).toEqual(['A', 'C']);
    });

    it('sorts content types by name', async function () {
      this.space.getPublishedContentTypes.resolves([
        makeCtMock('A', { name: 'y' }),
        makeCtMock('B', { name: 'Z' }),
        makeCtMock('C', { name: 'X' }),
      ]);
      await this.repo.refresh();
      expect(this.idValues[0]).toEqual(['C', 'A', 'B']);
    });

    it('returns filtered content types', async function () {
      this.space.getPublishedContentTypes.resolves([
        makeCtMock('A'),
        makeCtMock('B', { isDeleted: true }),
        makeCtMock('C'),
      ]);
      const cts = await this.repo.refresh();
      expect(cts.map((ct) => ct.getId())).toEqual(['A', 'C']);
    });
  });

  describe('#refreshBare()', () => {
    it('returns bare content type', async function () {
      this.space.getPublishedContentTypes.resolves([makeCtMock('A'), makeCtMock('B')]);
      const cts = await this.repo.refreshBare();
      expect(cts.map((ct) => ct.sys.id)).toEqual(['A', 'B']);
    });
  });

  describe('#publish()', () => {
    it('calls #publish() on content type', async function () {
      const ct = makeCtMock('CTID');
      await this.repo.publish(ct);
      sinon.assert.calledOnce(ct.publish);
    });

    it('adds content type to repo', async function () {
      const ct = makeCtMock('CTID');
      expect(this.idValues[0]).not.toContain('CTID');
      await this.repo.publish(ct);
      expect(this.idValues[0]).toContain('CTID');
    });
  });

  function makeSpaceMock() {
    return {
      getPublishedContentTypes: sinon.stub().resolves([]),
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
      publish: sinon.spy(function () {
        return $q.resolve(this);
      }),
    };
  }
});
