import { newClient } from './contentfulClient.es6';
import $httpMocked from 'ng/$http';

jest.mock('ng/$http', () => jest.fn(), { virtual: true });

describe('Contentful Client', () => {
  let client;

  beforeEach(() => {
    $httpMocked.mockClear();

    client = newClient({
      host: 'api.contentful.com',
      space: 'spaceid',
      accessToken: 'access_token'
    });
  });

  function getUrl(path) {
    return 'https://api.contentful.com:443/spaces/spaceid' + path;
  }

  function expectUrlPath(path) {
    expect($httpMocked.mock.calls[0][0].url).toEqual(getUrl(path));
  }

  async function failingTest(fn) {
    $httpMocked.mockRejectedValue({ data: 'rejected message' });
    const failMock = jest.fn();
    try {
      await fn();
    } catch (e) {
      failMock(e);
    }
    expect(failMock).toHaveBeenCalled();
    expect(failMock).toHaveBeenCalledWith('rejected message');
  }

  it('gets a space', async () => {
    $httpMocked.mockResolvedValue({ data: [] });
    await client.space();
    expectUrlPath('');
  });

  it('fails to get a space', () => {
    failingTest(() => {
      return client.space();
    });
  });

  it('gets content types', async () => {
    $httpMocked.mockResolvedValue({ data: [] });
    await client.contentTypes();
    expectUrlPath('/content_types');
  });

  it('fails to get content types', () => {
    failingTest(() => {
      return client.contentTypes();
    });
  });

  it('gets a content type', async () => {
    $httpMocked.mockResolvedValue({ data: { sys: {}, fields: [] } });

    await client.contentType('123');

    expectUrlPath('/content_types/123');
  });

  it('fails to get a content type', () => {
    failingTest(() => {
      return client.contentType('123');
    });
  });

  it('gets entries', async () => {
    $httpMocked.mockResolvedValue({ data: {} });
    await client.entries();
    expectUrlPath('/entries');
  });

  it('fails to get entries', () => {
    failingTest(() => {
      return client.entries();
    });
  });

  it('gets an entry', async () => {
    $httpMocked.mockResolvedValue({ data: { sys: {}, fields: {} } });
    await client.entry('123');
    expectUrlPath('/entries/123');
  });

  it('fails to get an entry', () => {
    failingTest(() => {
      return client.entry('123');
    });
  });

  it('gets assets', async () => {
    $httpMocked.mockResolvedValue({ data: {} });
    await client.assets();
    expectUrlPath('/assets');
  });

  it('fails to get assets', () => {
    failingTest(() => {
      return client.assets();
    });
  });

  it('gets an asset', async () => {
    $httpMocked.mockResolvedValue({ data: { sys: {}, fields: {} } });
    await client.asset('123');
    expectUrlPath('/assets/123');
  });

  it('fails to get an asset', () => {
    failingTest(() => {
      return client.asset('123');
    });
  });
});
