import LocaleRepo from 'data/CMA/LocaleRepo';

jest.mock('data/CMA/FetchAll', () => ({
  fetchAll: jest.fn().mockResolvedValue([{}, {}, {}]),
}));

describe('Locale Repo', () => {
  let endpoint, repo;
  beforeEach(async function () {
    endpoint = jest.fn();
    repo = LocaleRepo(endpoint);
  });

  it('gets all', async function () {
    const all = await repo.getAll();
    expect(all).toHaveLength(3);
  });

  it('saves new', async function () {
    const response = {};
    endpoint.mockResolvedValue(response);
    const result = await repo.save({ code: 'de-DE' });
    expect(endpoint).toHaveBeenCalledTimes(1);
    expect(endpoint).toHaveBeenCalledWith({
      method: 'POST',
      path: ['locales'],
      data: { code: 'de-DE' },
      version: undefined,
    });
    expect(result).toBe(response);
  });

  it('updates existing', async function () {
    await repo.save({ sys: { id: 'localeid', version: 2 }, name: 'English' });
    expect(endpoint).toHaveBeenCalledTimes(1);
    expect(endpoint).toHaveBeenCalledWith({
      method: 'PUT',
      path: ['locales', 'localeid'],
      data: { name: 'English' },
      version: 2,
    });
  });

  it('skips properties not accepted by the API', async function () {
    await repo.save({
      sys: {},
      default: true,
      fallback_code: 'wat',
      internal_code: 'lol',
      name: 'Polish',
    });

    expect(endpoint).toHaveBeenCalledTimes(1);
    expect(endpoint).toHaveBeenCalledWith({
      method: 'POST',
      path: ['locales'],
      data: { name: 'Polish' },
      version: undefined,
    });
  });

  it('removes', async function () {
    endpoint.mockResolvedValue({ rubbish: true });
    const result = await repo.remove('localeid', 123);
    expect(endpoint).toHaveBeenCalledTimes(1);
    expect(endpoint).toHaveBeenCalledWith({
      method: 'DELETE',
      path: ['locales', 'localeid'],
      version: 123,
    });
    expect(result).toBeUndefined();
  });
});
