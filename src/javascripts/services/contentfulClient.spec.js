import newClient from './contentfulClient';

global.fetch = jest.fn();

describe('Contentful Client', () => {
  let client;

  beforeEach(() => {
    global.fetch.mockResolvedValue({
      json: jest.fn(),
      ok: true,
    });

    client = newClient({
      host: 'api.contentful.com',
      space: 'spaceid',
      accessToken: 'access_token',
    });
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  afterAll(() => {
    global.fetch.mockClear();
    delete global.fetch;
  });

  function getUrl(path) {
    return 'https://api.contentful.com:443/spaces/spaceid' + path;
  }

  function expectUrlPath(path) {
    expect(global.fetch.mock.calls[0][0]).toEqual(getUrl(path));
  }

  async function failingTest(fn) {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => 'rejected message'),
      ok: false,
    });
    const failMock = jest.fn();
    try {
      await fn();
    } catch (e) {
      failMock(e);
    }
    expect(failMock).toHaveBeenCalledWith('rejected message');
  }

  it('gets a space', async () => {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => []),
      ok: true,
    });
    await client.space();
    expectUrlPath('');
  });

  it('fails to get a space', () => {
    failingTest(() => {
      return client.space();
    });
  });

  it('gets content types', async () => {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => []),
      ok: true,
    });
    await client.contentTypes();
    expectUrlPath('/content_types');
  });

  it('fails to get content types', () => {
    failingTest(() => {
      return client.contentTypes();
    });
  });

  it('gets a content type', async () => {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => ({ sys: {}, fields: [] })),
      ok: true,
    });

    await client.contentType('123');

    expectUrlPath('/content_types/123');
  });

  it('fails to get a content type', () => {
    failingTest(() => {
      return client.contentType('123');
    });
  });

  it('gets entries', async () => {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => ({})),
      ok: true,
    });
    await client.entries();
    expectUrlPath('/entries');
  });

  it('fails to get entries', () => {
    failingTest(() => {
      return client.entries();
    });
  });

  it('gets an entry', async () => {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => ({ sys: {}, fields: [] })),
      ok: true,
    });
    await client.entry('123');
    expectUrlPath('/entries/123');
  });

  it('fails to get an entry', () => {
    failingTest(() => {
      return client.entry('123');
    });
  });

  it('gets assets', async () => {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => ({})),
      ok: true,
    });
    await client.assets();
    expectUrlPath('/assets');
  });

  it('fails to get assets', () => {
    failingTest(() => {
      return client.assets();
    });
  });

  it('gets an asset', async () => {
    global.fetch.mockResolvedValue({
      json: jest.fn(() => ({ sys: {}, fields: [] })),
      ok: true,
    });
    await client.asset('123');
    expectUrlPath('/assets/123');
  });

  it('fails to get an asset', () => {
    failingTest(() => {
      return client.asset('123');
    });
  });
});
