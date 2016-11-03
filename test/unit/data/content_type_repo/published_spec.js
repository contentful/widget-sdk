describe('data/ContentTypeRepo/Published', function () {
  let K, $q;

  afterEach(function () {
    K = $q = null;
  });

  beforeEach(function () {
    module('contentful/test');
    K = this.$inject('mocks/kefir');
    $q = this.$inject('$q');

    const CTRepo = this.$inject('data/ContentTypeRepo/Published');
    this.space = makeSpaceMock();
    this.repo = CTRepo.create(this.space);

    const itemIds = this.repo.items$.map((ctList) => {
      return ctList.map((ct) => ct.sys.id).toArray();
    });
    this.idValues = K.extractValues(itemIds);
  });


  describe('#fetch()', function () {
    beforeEach(function () {
      this.space.getPublishedContentTypes.resolves([
        makeCtMock('already_fetched')
      ]);
      this.repo.refresh();
      this.$apply();
      this.space.getPublishedContentTypes.reset();

      this.space.getPublishedContentTypes.resolves([
        makeCtMock('already_fetched'),
        makeCtMock('to_be_fetched')
      ]);
    });

    it('resolves without reloading when content type exists', function* () {
      const ct = yield this.repo.fetch('already_fetched');
      expect(ct.getId()).toBe('already_fetched');
      sinon.assert.notCalled(this.space.getPublishedContentTypes);
    });

    it('resolves after reloading the published content types', function* () {
      const ct = yield this.repo.fetch('to_be_fetched');
      expect(ct.getId()).toBe('to_be_fetched');
      sinon.assert.called(this.space.getPublishedContentTypes);
    });

    it('emits new items list when ct is fetched', function* () {
      yield this.repo.fetch('to_be_fetched');
      expect(this.idValues[0]).toEqual(['already_fetched', 'to_be_fetched']);
    });
  });


  describe('#get()', function () {
    beforeEach(function () {
      this.space.getPublishedContentTypes.resolves([
        makeCtMock('already_fetched')
      ]);
      this.repo.refresh();
      this.$apply();
      this.space.getPublishedContentTypes.reset();
    });

    it('returns existing ct and does not trigger refresh', function () {
      const ct = this.repo.get('already_fetched');
      expect(ct.getId()).toBe('already_fetched');
      sinon.assert.notCalled(this.space.getPublishedContentTypes);
    });

    it('triggers refresh when content type is not available', function () {
      this.repo.get('foo');
      this.$apply();
      sinon.assert.called(this.space.getPublishedContentTypes);
    });
  });


  describe('#refresh()', function () {
    it('requests published content types', function () {
      sinon.assert.notCalled(this.space.getPublishedContentTypes);
      this.repo.refresh();
      sinon.assert.calledOnce(this.space.getPublishedContentTypes);
    });

    it('emits new items', function* () {
      this.idValues.splice(0);

      this.space.getPublishedContentTypes.resolves([
        makeCtMock('A'),
        makeCtMock('B')
      ]);
      yield this.repo.refresh();

      this.space.getPublishedContentTypes.resolves([
        makeCtMock('C'),
        makeCtMock('D')
      ]);
      yield this.repo.refresh();

      expect(this.idValues).toEqual([
        ['C', 'D'],
        ['A', 'B']
      ]);
    });

    it('filters deleted items', function* () {
      this.space.getPublishedContentTypes.resolves([
        makeCtMock('A'),
        makeCtMock('B', {isDeleted: true}),
        makeCtMock('C')
      ]);
      yield this.repo.refresh();
      expect(this.idValues[0]).toEqual(['A', 'C']);
    });

    it('sorts content types by name', function* () {
      this.space.getPublishedContentTypes.resolves([
        makeCtMock('A', {name: '2'}),
        makeCtMock('B', {name: '3'}),
        makeCtMock('C', {name: '1'})
      ]);
      yield this.repo.refresh();
      expect(this.idValues[0]).toEqual(['C', 'A', 'B']);
    });
  });


  describe('#publish()', function () {
    it('calls #publish() on content type', function* () {
      const ct = makeCtMock('CTID');
      yield this.repo.publish(ct);
      sinon.assert.calledOnce(ct.publish);
    });

    it('adds content type to repo', function* () {
      const ct = makeCtMock('CTID');
      expect(this.idValues[0]).not.toContain('CTID');
      yield this.repo.publish(ct);
      expect(this.idValues[0]).toContain('CTID');
    });
  });


  function makeSpaceMock () {
    return {
      getPublishedContentTypes: sinon.stub().resolves([])
    };
  }

  function makeCtMock (id, opts = {}) {
    const name = opts.name || id;
    return {
      data: {
        sys: {id},
        displayField: opts.displayField,
        fields: opts.fields || [],
        name: name
      },
      getId: _.constant(id),
      isDeleted: _.constant(opts.isDeleted === true),
      getName: _.constant(name),
      publish: sinon.spy(function () {
        return $q.resolve(this);
      })
    };
  }
});
