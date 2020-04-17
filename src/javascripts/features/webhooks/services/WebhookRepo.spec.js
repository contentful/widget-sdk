import { createWebhookRepo } from './WebhookRepo';

describe('Webhook Repo', function () {
  let space;
  let endpoint;
  let repo;

  beforeEach(async function () {
    endpoint = {};

    // chainable methods
    ['payload', 'headers'].forEach((method) => {
      endpoint[method] = jest.fn().mockReturnValue(endpoint);
    });

    // terminal methods
    ['get', 'delete', 'post', 'put'].forEach((method) => {
      endpoint[method] = jest.fn();
    });

    space = { endpoint: jest.fn().mockReturnValue(endpoint) };

    repo = createWebhookRepo(space);
  });

  describe('#getAll()', function () {
    it('calls endpoint and extracts items', async function () {
      const items = [1, 2, 3];
      endpoint.get.mockResolvedValue({ items: items });

      const items2 = await repo.getAll();
      expect(space.endpoint).toHaveBeenCalledTimes(1);
      expect(space.endpoint).toHaveBeenCalledWith('webhook_definitions', undefined);
      expect(items).toEqual(items2);
    });
  });

  describe('#get()', function () {
    it('calls endpoint with an ID', async function () {
      const webhook = { url: 'http://test.com' };
      endpoint.get.mockResolvedValue(webhook);

      const fetched = await repo.get('whid');
      expect(space.endpoint).toHaveBeenCalledTimes(1);
      expect(space.endpoint).toHaveBeenCalledWith('webhook_definitions', 'whid');
      expect(webhook).toBe(fetched);
    });

    it('stringifies payload transformation', async function () {
      const webhook = { url: 'http://test.com', transformation: { body: { test: true } } };
      endpoint.get.mockResolvedValue(webhook);

      const fetched = await repo.get('whid');
      const expected = JSON.stringify({ test: true }, null, 2);
      expect(fetched.transformation.body).toBe(expected);
    });
  });

  describe('#remove()', function () {
    it('calls endpoint with an ID extracted from a webook object', async function () {
      const webhook = { sys: { id: 'whid' } };
      endpoint.delete.mockResolvedValue();

      await repo.remove(webhook);

      expect(endpoint.delete).toHaveBeenCalledTimes(1);
      expect(space.endpoint).toHaveBeenCalledWith('webhook_definitions', 'whid');
    });
  });

  describe('#save()', function () {
    it('for a new entity, posts to the endpoint with a webhook as a payload', async function () {
      const webhook = { url: 'http://test.com' };
      endpoint.post.mockResolvedValue({ ...webhook, sys: { id: 'whid' } });

      const created = await repo.save(webhook);
      expect(space.endpoint).toHaveBeenCalledTimes(1);
      expect(endpoint.payload).toHaveBeenCalledTimes(1);
      expect(endpoint.post).toHaveBeenCalledTimes(1);
      expect(space.endpoint).toHaveBeenCalledWith('webhook_definitions', undefined);
      expect(endpoint.payload).toHaveBeenCalledWith(webhook);
      expect(webhook.url).toBe(created.url);
    });

    it('for existing entity, puts to the endpoint with an ID, webhook as a payload and version header', async function () {
      const webhook = { sys: { id: 'whid', version: 7 }, url: 'http://test.com' };
      endpoint.put.mockResolvedValue({ ...webhook, sys: { id: 'whid', version: 8 } });

      const saved = await repo.save(webhook);
      expect(space.endpoint).toHaveBeenCalledWith('webhook_definitions', 'whid');
      expect(endpoint.payload).toHaveBeenCalledTimes(1);
      expect(endpoint.headers).toHaveBeenCalledTimes(1);
      expect(endpoint.put).toHaveBeenCalledTimes(1);

      expect(endpoint.payload.mock.calls[0][0].url).toBe('http://test.com');
      expect(endpoint.headers.mock.calls[0][0]['X-Contentful-Version']).toBe(7);
      expect(webhook.url).toBe(saved.url);
    });

    it('parses body transformation before saving and stringifies the result', async function () {
      const webhook = { url: 'http://test.com', transformation: { body: '{"test":true}' } };
      endpoint.post.mockResolvedValue({
        ...webhook,
        transformation: { body: { test: true } },
        sys: { id: 'whid' },
      });

      const saved = await repo.save(webhook);
      expect(endpoint.payload).toHaveBeenCalledWith({
        url: 'http://test.com',
        transformation: { body: { test: true } },
      });
      expect(saved.transformation.body).toBe(JSON.stringify({ test: true }, null, 2));
    });
  });

  describe('#hasValidBodyTransformation()', function () {
    it('is valid with no body transformation', function () {
      expect(repo.hasValidBodyTransformation({})).toBe(true);
      expect(repo.hasValidBodyTransformation({ transformation: {} })).toBe(true);
    });

    it('is valid with parseable JSON string', function () {
      const webhook = { transformation: { body: '{"test":true}' } };
      expect(repo.hasValidBodyTransformation(webhook)).toBe(true);
      webhook.transformation.body = 'null';
      expect(repo.hasValidBodyTransformation(webhook)).toBe(true);
    });

    it('is invalid if a non-string value is given', function () {
      const webhook = { transformation: { body: { test: true } } };
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
      webhook.transformation.body = null;
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
    });

    it('is invalid with non-parsable JSON string', function () {
      const webhook = { transformation: { body: '{"test":true' } };
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
      webhook.transformation.body = '';
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
    });
  });
});
