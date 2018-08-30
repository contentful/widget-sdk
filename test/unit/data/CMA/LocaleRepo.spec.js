describe('Locale Repo', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('data/CMA/FetchAll.es6', {
        fetchAll: sinon.stub().resolves([{}, {}, {}])
      });
    });

    this.endpoint = sinon.stub();
    this.repo = this.$inject('data/CMA/LocaleRepo.es6').default(this.endpoint);
  });

  it('gets all', function*() {
    const all = yield this.repo.getAll();
    expect(all.length).toBe(3);
  });

  it('saves new', function*() {
    const response = {};
    this.endpoint.resolves(response);
    const result = yield this.repo.save({ code: 'de-DE' });
    sinon.assert.calledOnce(
      this.endpoint.withArgs({
        method: 'POST',
        path: ['locales'],
        data: { code: 'de-DE' },
        version: undefined
      })
    );
    expect(result).toBe(response);
  });

  it('updates existing', function*() {
    yield this.repo.save({ sys: { id: 'localeid', version: 2 }, name: 'English' });
    sinon.assert.calledOnce(
      this.endpoint.withArgs({
        method: 'PUT',
        path: ['locales', 'localeid'],
        data: { name: 'English' },
        version: 2
      })
    );
  });

  it('skips properties not accepted by the API', function*() {
    yield this.repo.save({
      sys: {},
      default: true,
      fallback_code: 'wat',
      internal_code: 'lol',
      name: 'Polish'
    });

    sinon.assert.calledOnce(
      this.endpoint.withArgs({
        method: 'POST',
        path: ['locales'],
        data: { name: 'Polish' },
        version: undefined
      })
    );
  });

  it('removes', function*() {
    this.endpoint.resolves({ rubbish: true });
    const result = yield this.repo.remove('localeid', 123);
    sinon.assert.calledOnce(
      this.endpoint.withArgs({
        method: 'DELETE',
        path: ['locales', 'localeid'],
        version: 123
      })
    );
    expect(result).toBeUndefined();
  });
});
