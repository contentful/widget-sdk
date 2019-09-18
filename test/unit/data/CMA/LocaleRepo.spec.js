import sinon from 'sinon';
import { $initialize } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('Locale Repo', () => {
  beforeEach(async function() {
    this.system.set('data/CMA/FetchAll.es6', {
      fetchAll: sinon.stub().resolves([{}, {}, {}])
    });

    const { default: LocaleRepo } = await this.system.import('data/CMA/LocaleRepo.es6');

    await $initialize(this.system);

    this.endpoint = sinon.stub();
    this.repo = LocaleRepo(this.endpoint);
  });

  it('gets all', async function() {
    const all = await this.repo.getAll();
    expect(all.length).toBe(3);
  });

  it('saves new', async function() {
    const response = {};
    this.endpoint.resolves(response);
    const result = await this.repo.save({ code: 'de-DE' });
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

  it('updates existing', async function() {
    await this.repo.save({ sys: { id: 'localeid', version: 2 }, name: 'English' });
    sinon.assert.calledOnce(
      this.endpoint.withArgs({
        method: 'PUT',
        path: ['locales', 'localeid'],
        data: { name: 'English' },
        version: 2
      })
    );
  });

  it('skips properties not accepted by the API', async function() {
    await this.repo.save({
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

  it('removes', async function() {
    this.endpoint.resolves({ rubbish: true });
    const result = await this.repo.remove('localeid', 123);
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
